/**
 * ============================================================================
 *  UTILITY BOT v2.0 — Powered by @whiskeysockets/baileys
 * ============================================================================
 *  Sistema di automazione WhatsApp professionale.
 *  Design: elegante, stabile, orientato all'utility.
 * ============================================================================
 */

'use strict';

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    downloadMediaMessage,
} = require('@whiskeysockets/baileys');

const qrcode  = require('qrcode-terminal');
const pino    = require('pino');
const fs      = require('fs');
const path    = require('path');
const axios   = require('axios');
const { execFile } = require('child_process');
const { promisify } = require('util');
const os      = require('os');

const execFileAsync = promisify(execFile);

// ============================================================================
//  PERSISTENZA DATI
// ============================================================================
const DB_FILE = path.join(__dirname, 'database.json');
let db = {};
let _saveTimer = null;

const loadDB = () => {
    if (fs.existsSync(DB_FILE)) {
        try {
            db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        } catch (e) {
            console.error('[DB] Errore lettura database, ripristino vuoto.', e.message);
            db = {};
        }
    }
};

const saveDB = () => {
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
        fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf-8', (err) => {
            if (err) console.error('[DB] Errore salvataggio:', err.message);
        });
    }, 500);
};

const getUser = (jid, chatId) => {
    if (!db[chatId]) db[chatId] = {};
    if (!db[chatId][jid]) {
        db[chatId][jid] = {
            money    : 100,
            warnings : 0,
            isMuted  : false,
            msgCount : 0,
            spouse   : null,
            children : [],
            parents  : [],
            inventory: [],
        };
        saveDB();
    }
    const user = db[chatId][jid];
    user.money = Number.isFinite(user.money) ? user.money : 100;
    user.warnings = Number.isFinite(user.warnings) ? user.warnings : 0;
    user.isMuted = Boolean(user.isMuted);
    user.msgCount = Number.isFinite(user.msgCount) ? user.msgCount : 0;
    user.spouse ??= null;
    user.children = Array.isArray(user.children) ? user.children : [];
    user.parents = Array.isArray(user.parents) ? user.parents : [];
    user.inventory = Array.isArray(user.inventory) ? user.inventory : [];
    return user;
};

loadDB();

// ============================================================================
//  UTILITÀ DI SISTEMA
// ============================================================================
const getCpuSnapshot = () => os.cpus().reduce((snapshot, cpu) => {
    const times = cpu.times || {};
    snapshot.idle += times.idle || 0;
    snapshot.total += Object.values(times).reduce((total, value) => total + value, 0);
    return snapshot;
}, { idle: 0, total: 0 });

// os.loadavg() restituisce sempre [0, 0, 0] su Windows. Qui calcoliamo
// l'uso effettivo della CPU confrontando due istantanee ravvicinate.
const getCpuUsage = (sampleMs = 500) => new Promise(resolve => {
    const start = getCpuSnapshot();

    setTimeout(() => {
        const end = getCpuSnapshot();
        const totalDelta = end.total - start.total;
        const idleDelta  = end.idle - start.idle;

        if (totalDelta <= 0) return resolve(null);

        const usage = Math.max(0, Math.min(100, (1 - idleDelta / totalDelta) * 100));
        resolve(usage);
    }, sampleMs);
});

const getSysInfo = async (cpuUsagePromise = getCpuUsage()) => {
    const totalBytes = os.totalmem();
    const usedBytes  = totalBytes - os.freemem();
    const uptimeSec  = process.uptime();
    const hours      = Math.floor(uptimeSec / 3600);
    const minutes    = Math.floor((uptimeSec % 3600) / 60);
    const cpus       = os.cpus();
    const cpuUsage   = await cpuUsagePromise;
    const processMem = process.memoryUsage();

    return {
        ramUsed    : (usedBytes / 1024 ** 3).toFixed(2),
        ramTotal   : (totalBytes / 1024 ** 3).toFixed(2),
        ramPercent : ((usedBytes / totalBytes) * 100).toFixed(1),
        cpu        : cpuUsage === null ? 'N/D' : `${cpuUsage.toFixed(1)}%`,
        cpuModel   : cpus[0]?.model?.replace(/\s+/g, ' ').trim() || 'Sconosciuto',
        cpuCores   : os.availableParallelism ? os.availableParallelism() : cpus.length,
        processRam : (processMem.rss / 1024 ** 2).toFixed(1),
        heapUsed   : (processMem.heapUsed / 1024 ** 2).toFixed(1),
        uptime     : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
        platform   : `${os.type()} ${os.release()} (${os.arch()})`,
        node       : process.version,
    };
};

const normalizeJid = (jid) => typeof jid === 'string'
    ? jid.trim().replace(/:\d+(?=@)/, '')
    : '';

const sameJid = (first, second) => {
    const normalizedFirst  = normalizeJid(first);
    const normalizedSecond = normalizeJid(second);
    return Boolean(normalizedFirst && normalizedSecond && normalizedFirst === normalizedSecond);
};

const isAdminParticipant = (participant, jid) => {
    if (!['admin', 'superadmin'].includes(participant?.admin)) return false;

    // Le versioni recenti di Baileys possono usare @lid per `id` e
    // conservare il JID telefonico in `jid`; controlliamo entrambi.
    return [participant.id, participant.jid, participant.lid]
        .filter(Boolean)
        .some(participantJid => sameJid(participantJid, jid));
};

const getGroupAdminState = async (sock, groupJid, senderJids) => {
    const metadata = await sock.groupMetadata(groupJid);
    const participants = Array.isArray(metadata?.participants) ? metadata.participants : [];
    const isAdmin = (jids) => jids
        .filter(Boolean)
        .some(jid => participants.some(participant => isAdminParticipant(participant, jid)));

    return {
        isBotAdmin    : isAdmin([sock.user?.id, sock.user?.lid]),
        isSenderAdmin : isAdmin(senderJids),
    };
};

const ADMIN_COMMANDS = new Set(['tagall', 'chiudi', 'apri', 'ban', 'del', 'mute', 'unmute', 'warn']);

const extractBody = (msg) => {
    const m = msg.message;
    if (!m) return '';
    return (
        m.conversation ||
        m.extendedTextMessage?.text ||
        m.imageMessage?.caption ||
        m.videoMessage?.caption ||
        m.buttonsResponseMessage?.selectedButtonId ||
        m.listResponseMessage?.singleSelectReply?.selectedRowId ||
        ''
    );
};

// ============================================================================
//  ARRAY RISPOSTE (Mantenuti uguali ma pronti all'uso)
// ============================================================================
const ARRAYS = {
    schiaffi: [
        "ha tirato uno schiaffo che ha fatto resettare il router. 💥",
        "ha mollato un ceffone così forte che i tuoi antenati hanno chiesto scusa. 🖐️",
        "ha colpito con la forza di mille nonne incazzate. 👵💢",
        "ha stampato le 5 dita in faccia stile WiFi. 📶🤕",
        "ha dato uno schiaffo che ha aggiornato il sistema direttamente a Windows 11. 💻",
        "ha tirato una sberla che ha piegato lo spaziotempo. 🌌",
        "ha colpito così forte che ora parli fluentemente l'aramaico antico. 📜",
        "ha mollato un ceffone che ha fatto sbalzare il QI sotto zero. 📉",
        "ha stampato un cinque in faccia. Letale. ✋",
        "ha preso a schiaffi con la delicatezza di un tir in autostrada. 🚛",
        "ha mollato una sberla che ha fatto scordare la password del telefono. 📱",
        "ha colpito. Il dentista ringrazia per il nuovo yacht. 🦷🛥️",
        "ha tirato uno schiaffo così fotonico da far fare il giro del mondo in 80ms. 🌍",
        "ha mollato un ceffone. Ora il viso è un'opera d'arte cubista. 🎨",
        "ha schiaffeggiato con l'ira funesta del pelide Achille. 🏛️",
        "ha stampato una sberla così secca da sovrascrivere la partizione dei neuroni. 🧠⚡",
        "ha dato un ceffone che ha fatto vibrare persino i pannelli acustici in MDF. 🪵🔊",
        "ha mollato uno schiaffo facendo compiere tre orbite ellittiche al bersaglio. 🪐☄️",
        "ha colpito così forte da de-sincronizzare l'account Spotify dai server centrali. 🎵❌",
        "ha dato un ceffone fulmineo che ha superato il refresh rate da 360Hz. 🖥️💨",
        "ha colpito con una sberla termica che ha mandato in thermal throttling i core CPU. 🌡️🔥",
        "ha stampato un dritto in faccia facendo vedere le stelle senza telescopio. 🔭✨",
        "ha rifilato un ceffone che ha flashato una GSI corrotta direttamente nel cervello. 📱💀",
        "ha mollato una sberla così potente da ricompilare il kernel del sistema nervoso. ⚙️🧠",
        "ha colpito con precisione da laser CNC lasciando un'impronta permanente. 🔦💢",
    ],
    insulti: [
        "Sei il motivo per cui gli alieni passano oltre senza fermarsi. 👽",
        "Sei utile quanto un semaforo in GTA. 🚦",
        "Il tuo albero genealogico dev'essere un cerchio perfetto. 🌳",
        "Hai l'utilità di un posacenere su una moto. 🏍️",
        "Se l'ignoranza volasse, daresti da mangiare ai piccioni. 🐦",
        "Il tuo QI è a temperatura ambiente. In gradi Celsius. 🌡️",
        "Sei la prova vivente che l'evoluzione può fare marcia indietro. 🐒",
        "Se avessi un euro per ogni tua idea intelligente, sarei in debito. 💸",
        "Sei così denso che la luce si piega attorno a te. 🕳️",
        "Anche un file .txt vuoto ha più contenuti di te. 📄",
        "Sei come i termini e condizioni d'uso: nessuno ti legge. 📑",
        "Hai due neuroni e stanno litigando per l'affidamento del terzo. 🧠",
        "Sei l'errore 404 dell'intelligenza umana. 🚫",
        "Sei così inutile che persino il correttore automatico ha smesso di provarci. ⌨️",
        "La tua stabilità mentale è inferiore a quella di un server senza load balancer. 📉🛡️",
        "Sei utile come una ventola da 120mm montata al contrario in un case sigillato. 🌬️❌",
        "Hai lo stesso tempismo di chi sbaglia il bilanciamento su una montatura equatoriale. ⚖️🔭",
        "Sei così noioso che persino un workflow automatizzato va in timeout pur di non eseguirti. ⏰🔄",
        "Il tuo livello di interazione sociale è rimasto fermo alla modalità provvisoria di Windows 98. 💾📟",
        "Sembri un cabinet acustico vuoto: fai solo un gran vuoto dentro. 🔈🕳️",
        "Hai la stessa precisione balistica di un ferro da stiro lanciato a caso. 💣🎮",
        "Il tuo QI potrebbe andare in underflow. 🔢❌",
        "Sei denso come la colla siliconica usata per sigillare i sogni andati a male. 🪵💧",
        "Valore di mercato: inferiore al costo di un byte su un floppy disk rotto. 💾📉",
        "Sei il tipo di persona che restituisce NaN quando le si chiede il senso della vita. 🤖❓",
    ],
    fiori: [
        "🌷 un tulipano rosa e un sorriso grande così",
        "🌹 una rosa rossa con glitter immaginari",
        "🌻 un girasole con energia da giornata perfetta",
        "🌼 una margherita che sa di cose semplici e belle",
        "🪻 un mazzetto lilla con vibes super delicate",
        "🌸 dei fiori di ciliegio appena caduti dal cielo",
        "💐 un bouquet colorato che mette subito il buonumore",
        "🪷 un fiore di loto per una giornata tranquilla",
        "🌺 un ibisco tropicale con un pizzico d'estate",
        "🪻 una lavanda profumata per scacciare lo stress",
        "🌹 una rosa bianca, elegante e piena di pace",
        "🌷 un tulipano giallo carico di allegria",
        "🌼 un mazzolino di campo raccolto con cura",
        "🌸 una peonia soffice come una nuvola",
        "🌻 un girasole che punta dritto alle cose belle",
        "💐 un bouquet con un bigliettino: 'sei prezioso/a'",
        "🌺 una camelia con una dose extra di dolcezza",
        "🪷 un fiore portafortuna per oggi e per domani",
        "🌼 una margherita con dentro un desiderio segreto",
        "🌸 un rametto fiorito e un abbraccio virtuale",
    ],
    tette: [
        "🍒 Taglia: Piattaforma d'atterraggio per zanzare. Voto: 2/10",
        "🍒 Taglia: Due airbag esplosi. Voto: 8/10",
        "🍒 Taglia: Meloni di stagione! Voto: 9/10",
        "🍒 Taglia: Limoni acerbi. C'è potenziale. Voto: 5/10",
        "🍒 Taglia: Palle da bowling. Voto: 10/10",
        "🍒 Taglia: Uova al tegamino. Voto: 6/10",
        "🍒 Taglia: Cuscini memory foam. Voto: 9/10",
        "🍒 Taglia: Mandarini a dicembre. Voto: 7/10",
        "🍒 Taglia: Palloncini gonfiati a elio. Voto: 8/10",
        "🍒 Taglia: Zucche di Halloween. Voto: 8.5/10",
        "🍒 Taglia: Ciliegine sulla torta. Voto: 7.5/10",
        "🍒 Taglia: Due montagne russe. Voto: 10/10",
        "🍒 Taglia: Piatto doccia. Voto: 0/10",
        "🍒 Taglia: Cocco fresco da spiaggia. Voto: 8/10",
        "🍒 Taglia: Due mappamondi. Voto: 10/10",
        "🍒 Taglia: Geometria pulita degna di un layout AutoCAD. Voto: 8.5/10",
        "🍒 Taglia: Due coni acustici ad alta efficienza. Voto: 9.5/10",
        "🍒 Taglia: Due splendidi emisferi visibili a occhio nudo. Voto: 10/10",
        "🍒 Taglia: Versione overclockata di serie. Scaldano l'ambiente. Voto: 9/10",
        "🍒 Taglia: File corrotto durante la decompressione. Non pervenute. Voto: 3/10",
        "🍒 Taglia: Più piatte di un desktop Linux senza icone. Voto: 4/10",
        "🍒 Taglia: Due splendide curve raccordate a 90 gradi. Voto: 8/10",
        "🍒 Taglia: Coppa da veri campioni. Voto: 10/10",
        "🍒 Taglia: Due sfere ad alta risoluzione, degne di monitor 4K. Voto: 9/10",
        "🍒 Taglia: Struttura solida ma manca stabilità portante. Voto: 6/10",
    ],
    bacia: [
        "ha stampato un bacio appassionato a",
        "ha dato un bacio a stampo sulle labbra di",
        "ha rubato un bacio improvviso a",
        "ha baciato dolcemente la fronte di",
        "ha dato un bacio alla francese con le tonsille in omaggio a",
        "ha baciato con foga da film hollywoodiano",
        "ha dato un bacino timido a",
        "ha lasciato un segno di rossetto sulla guancia di",
        "ha inciampato ed è finito per baciare per sbaglio",
        "ha dato un bacio romantico sotto la pioggia a",
        "ha baciato con la precisione millimetrica di un laser a",
        "ha stampato un bacio crittografato end-to-end sulla guancia di",
        "ha baciato con lo stesso entusiasmo di chi vince al novantreesimo minuto a",
        "ha dato un bacio così intenso da mandare in cortocircuito la rete locale insieme a",
        "ha dato un bacio supersonico lasciando una scia termica nell'aria verso",
    ],
    scopa: [
        "ha sfondato il letto a forza di saltare addosso a 🔞",
        "ha fatto vedere le stelle a 🔞",
        "ha cavalcato come un toro da rodeo 🔞🐂",
        "ha sbattuto al muro e fatto danni veri a 🔞💥",
        "ha consumato le lenzuola in una notte di fuoco con 🔞🔥",
        "ha impostato una frequenza devastante mandando in blocco il sistema di 🔞⚡",
        "ha eseguito un overclock estremo delle prestazioni con 🔞🔥",
        "ha dominato completamente il terreno di gioco con 🔞⚽",
        "ha bypassato le barriere di sicurezza di 🔞🛡️",
        "ha completato la sequenza di attacco frontale perfetto lasciando esausto/a 🔞🏁",
        "ha fatto fare ginnastica da camera intensiva a 🔞🤸",
        "ha trivellato come cercasse petrolio nel corpo di 🔞🛢️",
        "ha fatto fare i salti mortali sul materasso a 🔞🏎️",
        "ha fatto gridare il nome di tutti i santi del calendario a 🔞📝",
        "ha fatto sudare sette camicie (e perso tutti i vestiti) con 🔞💦",
    ],
    paccasulculo: [
        "ha dato una pacca talmente allegra da far applaudire anche le sedie 🍑",
        "ha lanciato una pacca con precisione da chirurgo del caos 🍑✨",
        "ha dato una pacca così teatrale che è partita la sigla finale 🎬🍑",
        "ha fatto una pacca veloce e poi ha fatto finta di niente 😇🍑",
        "ha consegnato una pacca premium, con effetto sonoro incluso 🔊🍑",
        "ha dato una pacca che ha migliorato il morale del gruppo del 3% 📈🍑",
        "ha fatto una pacca da manuale, voto dieci e lode 🏆🍑",
        "ha dato una pacca con l'eleganza di un ballerino/a di salsa 💃🍑",
        "ha sferrato una pacca amichevole a velocità supersonica 💨🍑",
        "ha dato una pacca e ha lasciato soltanto vibes positive ✨🍑",
        "ha fatto una pacca così precisa da meritare il replay VAR 📺🍑",
        "ha dato una pacca con la delicatezza di un peluche impazzito 🧸🍑",
        "ha lasciato una pacca firmata, timbrata e approvata ✅🍑",
        "ha dato una pacca da protagonista assoluto/a della scena 🌟🍑",
        "ha fatto una pacca e il gruppo ha chiesto il bis 👏🍑",
        "ha regalato una pacca di incoraggiamento, versione deluxe 🎁🍑",
    ],
    uccidi: [
        "ha sconfitto in un duello immaginario",
        "ha battuto in una sfida a Mario Kart contro",
        "ha mandato KO a colpi di cuscino",
        "ha vinto una battaglia di meme contro",
        "ha superato in una gara di karaoke contro",
        "ha messo in fuga con una combo da videogame",
        "ha battuto in un duello di sguardi contro",
        "ha conquistato il titolo di campione contro",
        "ha fatto perdere una partita a sasso-carta-forbici a",
        "ha dominato in una battaglia di GIF contro",
        "ha chiuso il match con una mossa da cartone animato contro",
        "ha vinto il torneo immaginario contro",
        "ha ottenuto una vittoria epica contro",
        "ha fatto ragequitare per finta",
        "ha strappato una vittoria all'ultimo secondo contro",
        "ha battuto con una mossa segreta da gamer contro",
    ],
    abbraccia: [
        "ha stretto in un abbraccio da otto secondi esatti",
        "ha dato un abbraccio così caldo da sciogliere il ghiaccio",
        "ha avvolto in un abbraccio morbido come una coperta",
        "ha regalato un abbraccio con bonus serenità",
        "ha dato un abbraccio che ricarica la batteria sociale",
        "ha abbracciato con tutta l'energia di un golden retriever",
        "ha lasciato un abbraccio grande formato",
        "ha dato un abbraccio con modalità coccola attivata",
        "ha stretto forte forte in un abbraccio",
        "ha mandato un abbraccio con consegna immediata",
        "ha dato un abbraccio che merita una colonna sonora",
        "ha avviato una terapia a base di abbracci con",
        "ha regalato un abbraccio certificato anti-giornata-no",
        "ha abbracciato con delicatezza e mille stelline",
        "ha dato un abbraccio da copertina",
        "ha condiviso un abbraccio pieno di bene",
    ],
    sposa: [
        "ha tirato fuori un anello brillante e ha fatto la proposta a",
        "ha chiesto di sposarlo/a sotto una pioggia di coriandoli a",
        "ha organizzato una proposta con orchestra immaginaria per",
        "ha aperto una scatolina misteriosa davanti a",
        "ha preparato una proposta da film romantico per",
        "ha promesso pizza, serie TV e felicità a",
        "ha chiesto un sì con un cartello pieno di cuori a",
        "ha fatto una proposta con effetti speciali per",
        "ha lanciato il bouquet e ha guardato negli occhi",
        "ha scritto una lettera dolcissima per",
        "ha prenotato una luna di miele immaginaria con",
        "ha chiesto di diventare compagni/e di avventure a",
        "ha preparato una proposta con 100 emoji per",
        "ha fatto partire la musica romantica e ha chiesto a",
        "ha scelto il momento perfetto per fare la proposta a",
        "ha promesso di dividere anche l'ultima fetta di pizza con",
    ],
    caos: [
        "ha fatto salire troppo la temperatura delle vibes con",
        "ha acceso una scena super movimentata insieme a",
        "ha trasformato la chat in un romanzo rosa con",
        "ha creato un caos romantico fuori scala con",
        "ha fatto partire una telenovela piena di emoji con",
        "ha lasciato tutti senza parole dopo una serata di vibes con",
        "ha reso la situazione decisamente piccante con",
        "ha trasformato il gruppo in una commedia romantica con",
        "ha alzato il livello del drama romantico con",
        "ha fatto saltare il termostato delle emozioni con",
        "ha creato un momento da film vietato ai dettagli con",
        "ha portato la chat in modalità 'troppo entusiasmo' con",
        "ha acceso fuochi d'artificio immaginari con",
        "ha fatto perdere la calma, ma con stile, a",
        "ha reso tutto più caotico e romantico con",
        "ha chiuso la scena con un sorriso malizioso verso",
    ],
    verita: [
        "Qual è la figuraccia più grande che hai fatto in pubblico?",
        "Hai mai rubato qualcosa, anche di piccolo?",
        "Qual è l'ultima persona di questo gruppo che hai stalkerato sui social?",
        "Qual è il tuo segreto più inconfessabile?",
        "Hai mai finto di stare male per evitare un impegno?",
        "Cosa pensi veramente del creatore di questo bot?",
        "Qual è la bugia più grossa che hai mai raccontato a un tuo ex?",
        "Hai mai spiato il telefono di qualcuno di nascosto?",
        "Quale membro del gruppo butteresti giù dalla torre?",
    ],
    obbligo: [
        "Manda l'ultima foto che hai salvato nella galleria, qualunque essa sia.",
        "Scrivi 'Ti amo' al primo contatto della rubrica e manda lo screen.",
        "Imposta come immagine di profilo una foto imbarazzante scelta dal gruppo per 24h.",
        "Invia un audio in cui canti la sigla di Peppa Pig a squarciagola.",
        "Scrivi a tua madre/tuo padre che hai deciso di scappare in Messico.",
        "Manda lo screen della tua cronologia di ricerca (no modalità incognito!).",
        "Registra un audio di 30 secondi in cui fai il verso di una gallina disperata.",
        "Dichiara il tuo amore a caso a una persona in questo gruppo.",
    ],
};

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Testi brevi e naturali: il bot deve sembrare una persona simpatica, non un manuale tecnico.
const COPY = {
    slap: [
        'ha tirato uno schiaffo che si è sentito anche nel gruppo vicino.',
        'ha dato una sberla con una sicurezza assurda.',
        'ha lasciato il segno. Letteralmente.',
        'ha tirato uno schiaffo da scena finale di una serie.',
        'ha dato un ceffone: silenzio totale per tre secondi.',
    ],
    insults: [
        'Hai un talento raro: complicare anche le cose facili.',
        'Non sei in ritardo, vivi proprio su un altro fuso orario.',
        'Hai portato il caos, come sempre. Iconico però.',
        'Sei la prova che si può parlare tanto e dire poco.',
        'Oggi non ci sei proprio con la testa, ma va bene così.',
    ],
    curves: [
        'Voto del bot: 8/10. Oggi si vola.',
        'Voto del bot: 6/10. Onesto, ci sta.',
        'Voto del bot: 10/10. Main character energy.',
        'Voto del bot: 7/10. Niente male dai.',
        'Voto del bot: 9/10. Qui c’è qualità.',
    ],
    kiss: [
        'ha dato un bacio a',
        'ha rubato un bacino a',
        'ha baciato con molta sicurezza',
        'ha lasciato un bacio sulla guancia di',
        'ha fatto partire un momento super romantico con',
    ],
    adults: [
        'ha avuto una serata decisamente movimentata con',
        'ha acceso un po’ troppo le vibes con',
        'ha creato caos romantico insieme a',
        'ha fatto perdere la calma a',
    ],
};

const formatMoney = (value) => `${Math.max(0, Math.floor(Number(value) || 0))}€`;

const getContextInfo = (message = {}) =>
    message.extendedTextMessage?.contextInfo ||
    message.imageMessage?.contextInfo ||
    message.videoMessage?.contextInfo ||
    {};

const getQuotedKey = (chatId, contextInfo) => ({
    remoteJid: chatId,
    fromMe   : false,
    id       : contextInfo.stanzaId,
    participant: contextInfo.participant,
});

// ============================================================================
//  MOTORE DI CONNESSIONE BAILEYS
// ============================================================================
async function startBot() {
    console.log('[BOT] Avvio in corso...');
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth            : state,
        printQRInTerminal: true,
        logger          : pino({ level: 'silent' }),
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) qrcode.generate(qr, { small: true });

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            if (statusCode === DisconnectReason.loggedOut) {
                console.log('[BOT] Sessione scaduta. Elimina la cartella auth_info_baileys e riavvia.');
            } else {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('[BOT] Connesso e operativo.');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg?.message || msg.key.fromMe) return;

        const from     = msg.key.remoteJid;
        const isGroup  = from?.endsWith('@g.us') === true;
        const sender   = isGroup ? (msg.key.participant || msg.key.participantPn) : from;
        const senderPn = isGroup ? msg.key.participantPn : null;
        const pushName = msg.pushName || 'Utente';

        if (isGroup && sender) {
            try {
                const userData = getUser(sender, from);
                userData.msgCount = (userData.msgCount || 0) + 1;
                saveDB();
            } catch (_) {}
        }

        const body = extractBody(msg);
        try {
            const senderData = getUser(sender, from);
            if (senderData.isMuted && isGroup) {
                try { await sock.sendMessage(from, { delete: msg.key }); } catch (_) {}
                return;
            }
        } catch (_) {}

        if (!body.startsWith('.')) return;

        const args      = body.slice(1).trim().split(/\s+/);
        const command   = (args.shift() || '').toLowerCase();
        if (!command) return;
        const textArgs  = args.join(' ');
        const contextInfo = getContextInfo(msg.message);
        const mentioned = contextInfo.mentionedJid || [];
        const isReply   = !!contextInfo.quotedMessage;
        const targetJid = mentioned[0] || contextInfo.participant || null;

        const reply = async (text) => {
            try { await sock.sendMessage(from, { text }, { quoted: msg }); } 
            catch (e) { console.error(`[reply] Errore invio: ${e.message}`); }
        };

        let isBotAdmin    = false;
        let isSenderAdmin = false;

        if (isGroup && ADMIN_COMMANDS.has(command)) {
            try {
                ({ isBotAdmin, isSenderAdmin } = await getGroupAdminState(sock, from, [sender, senderPn]));
            } catch (error) {
                console.error('[admin] Impossibile leggere i permessi del gruppo:', error.message);
                return reply("⚠️ Non riesco a verificare i permessi del gruppo. Riprova tra qualche secondo.");
            }
        }

        try {
        // ── PING ───────────────────────────────────────────────────────────────────
        if (command === 'ping') {
            const cpuUsagePromise = getCpuUsage();
            let pfpUrl;
            try { pfpUrl = await sock.profilePictureUrl(from, 'image'); } catch (e) { pfpUrl = null; }

            const start = Date.now();
            const pingMsg = await sock.sendMessage(from, { text: '✨ *Elaborazione dati di sistema...*' }, { quoted: msg });
            const latency = Date.now() - start;
            const info    = await getSysInfo(cpuUsagePromise);

            const txt = 
`╭━━━〔 ⚡ *SYSTEM STATUS* 〕━━━╮
┃ ⏱️ *Latenza:* ${latency} ms
┃ 🖥️ *CPU:* ${info.cpuModel}
┃ 🧠 *Core:* ${info.cpuCores} | *Uso sistema:* ${info.cpu}
┃ 💾 *RAM sistema:* ${info.ramUsed} GB / ${info.ramTotal} GB (${info.ramPercent}%)
┃ 🤖 *Processo bot:* ${info.processRam} MB RAM | Heap ${info.heapUsed} MB
┃ ⏳ *Uptime bot:* ${info.uptime}
┃ 🧩 *Sistema:* ${info.platform}
┃ 🟢 *Node.js:* ${info.node}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            if (pfpUrl) {
                await sock.sendMessage(from, { delete: pingMsg.key });
                await sock.sendMessage(from, { image: { url: pfpUrl }, caption: txt }, { quoted: msg });
            } else {
                await sock.sendMessage(from, { text: txt, edit: pingMsg.key });
            }
        }

        // ── MENU ───────────────────────────────────────────────────────────────────
        else if (command === 'menu') {
            let pfpUrl;
            try { pfpUrl = await sock.profilePictureUrl(from, 'image'); } catch (e) { pfpUrl = null; }

            const menuTxt =
`╭━━━〔 🤖 *UTILITY BOT v2.0* 〕━━━╮
┃ Ciao, *${pushName}*! 👋
┃
┃ 💝 *FAMIGLIA*
┃ ├ .famiglia ➔ Info
┃ ├ .famiglia sposa @u
┃ ├ .famiglia adotta @u
┃ ├ .famiglia divorzia
┃ ├ .famiglia caccia @u
┃ └ .famiglia abbandona
┃
┃ 🪙 *ECONOMIA & GIOCHI*
┃ ├ .cassaforte ➔ Saldo
┃ ├ .top ➔ Attività
┃ ├ .ricchi ➔ Classifica
┃ ├ .scava ➔ Lavora
┃ ├ .dadi [€] ➔ Lancia
┃ ├ .slot ➔ Slot Machine
┃ ├ .roulette ➔ Rischia
┃ └ .sasso / .carta / .forbici
┃
┃ 🎲 *SOCIAL & FUN*
┃ ├ .fiore [@u] ➔ Regala un fiore
┃ ├ .ship ➔ Matchmaking
┃ ├ .gay / .simpatometro [@u]
┃ ├ .percentuale [evento]
┃ ├ .scelta [A] o [B]
┃ ├ .personaggio ➔ RPG
┃ ├ .anime ➔ Profilo
┃ ├ .verita / .obbligo
┃ └ .assemblapc ➔ PC casuale
┃
┃ 🔥 *INTERAZIONI*
┃ ├ .tette
┃ ├ .meme
┃ ├ .incinta @u
┃ ├ .scopa / .sborra / .ditalino / .sega @u
┃ ├ .bacia / .abbraccia / .sposa @u
┃ └ .schiaffo / .paccasulculo / .uccidi / .insulta @u
┃
┃ 🛠️ *UTILITY*
┃ ├ .ping ➔ Stato bot
┃ ├ .weather [città]
┃ ├ .lyrics [titolo]
┃ ├ .sticker / .s ➔ Crea sticker
┃ ├ .vv ➔ Rivela view-once
┃ ├ .hack @u ➔ Fake hack
┃ └ .clona [testo] ➔ Inverti
┃
┃ 👑 *ADMIN (Solo Admin)*
┃ ├ .tagall ➔ Chiama tutti
┃ ├ .chiudi / .apri ➔ Chat lock
┃ ├ .ban @u ➔ Espelli
┃ ├ .del ➔ Elimina msg
┃ ├ .mute / .unmute @u
┃ └ .warn @u ➔ Avviso
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            if (pfpUrl) {
                await sock.sendMessage(from, { image: { url: pfpUrl }, caption: menuTxt }, { quoted: msg });
            } else {
                await reply(menuTxt);
            }
        }

        // ── FAMIGLIA ───────────────────────────────────────────────────────────────
        else if (command === 'famiglia') {
            const subCmd = args[0]?.toLowerCase();
            const target = mentioned[0];
            const uDB    = getUser(sender, from);

            if (!subCmd) {
                let albero = 
`╭━━━〔 🌳 *ALBERO GENEALOGICO* 〕━━━╮
┃ 👤 *Utente:* ${pushName}
┃ 💍 *Partner:* ${uDB.spouse ? `@${uDB.spouse.split('@')[0]}` : '_Nessuno_'}
┃ 👴 *Genitori:* ${uDB.parents.length > 0 ? uDB.parents.map(p => `@${p.split('@')[0]}`).join(', ') : '_Nessuno_'}
┃ 🍼 *Figli:* ${uDB.children.length > 0 ? uDB.children.map(c => `@${c.split('@')[0]}`).join(', ') : '_Nessuno_'}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

                const mentions = [...(uDB.spouse ? [uDB.spouse] : []), ...uDB.parents, ...uDB.children];
                await sock.sendMessage(from, { text: albero, mentions });
            }
            // (Il resto delle funzioni famiglia rimangono identiche a livello logico ma formattate meglio se vuoi)
            else if (subCmd === 'sposa' && target) {
                if (target === sender) return reply("❌ Non puoi sposarti da solo.");
                const tDB = getUser(target, from);
                if (uDB.spouse) return reply("❌ Sei già sposato/a in questo gruppo.");
                if (tDB.spouse) return reply("❌ Questo utente è già sposato/a.");

                uDB.spouse = target;
                tDB.spouse = sender;
                saveDB();
                await sock.sendMessage(from, {
                    text: `💒 *MATRIMONIO* 🎉\n@${sender.split('@')[0]} e @${target.split('@')[0]} si sono appena sposati!`,
                    mentions: [sender, target],
                });
            }
            else if (subCmd === 'divorzia') {
                if (!uDB.spouse) return reply("❌ Non sei sposato/a.");
                const ex = uDB.spouse;
                const exDB = getUser(ex, from);
                uDB.spouse = null;
                exDB.spouse = null;
                saveDB();
                await sock.sendMessage(from, {
                    text: `💔 *DIVORZIO*\n@${sender.split('@')[0]} ha divorziato ufficialmente da @${ex.split('@')[0]}.`,
                    mentions: [sender, ex],
                });
            }
            else if (subCmd === 'adotta') {
                if (!target) return reply("Tagga la persona che vuoi adottare.");
                if (target === sender) return reply("Non puoi adottare te stesso/a, dai.");
                if (uDB.children.includes(target)) return reply("Questa persona fa già parte della tua famiglia.");

                const tDB = getUser(target, from);
                uDB.children.push(target);
                if (!tDB.parents.includes(sender)) tDB.parents.push(sender);
                saveDB();
                await sock.sendMessage(from, {
                    text: `🍼 @${sender.split('@')[0]} ha adottato @${target.split('@')[0]}. Famiglia aggiornata!`,
                    mentions: [sender, target],
                });
            }
            else if (subCmd === 'caccia') {
                if (!target) return reply("Tagga la persona da rimuovere dalla famiglia.");
                if (!uDB.children.includes(target)) return reply("Questa persona non è tra i tuoi figli nel bot.");

                const tDB = getUser(target, from);
                uDB.children = uDB.children.filter(child => child !== target);
                tDB.parents = tDB.parents.filter(parent => parent !== sender);
                saveDB();
                await sock.sendMessage(from, {
                    text: `🚪 @${target.split('@')[0]} non è più nella famiglia di @${sender.split('@')[0]}.`,
                    mentions: [sender, target],
                });
            }
            else if (subCmd === 'abbandona') {
                if (uDB.parents.length === 0) return reply("Non hai genitori registrati nel bot.");
                const parents = [...uDB.parents];
                for (const parent of parents) {
                    const parentDB = getUser(parent, from);
                    parentDB.children = parentDB.children.filter(child => child !== sender);
                }
                uDB.parents = [];
                saveDB();
                await sock.sendMessage(from, {
                    text: `🚶 @${sender.split('@')[0]} ha scelto di andare per la sua strada.`,
                    mentions: [sender],
                });
            }
            else {
                await reply("Uso: .famiglia, .famiglia sposa @utente, .famiglia adotta @utente, .famiglia divorzia, .famiglia caccia @utente oppure .famiglia abbandona");
            }
        }

        // ── CASSAFORTE ─────────────────────────────────────────────────────────────
        else if (command === 'cassaforte') {
            const bal = getUser(sender, from).money;
            await reply(
`╭━━━〔 🏦 *CASSAFORTE* 〕━━━╮
┃ 👤 *Titolare:* ${pushName}
┃ 💰 *Saldo Attuale:* ${bal}€
╰━━━━━━━━━━━━━━━━━━━━━━━━╯`
            );
        }

        // ── SCAVA ──────────────────────────────────────────────────────────────────
        else if (command === 'scava') {
            const guadagno = Math.floor(Math.random() * 50) + 10;
            const uDB      = getUser(sender, from);
            uDB.money += guadagno;
            saveDB();
            await reply(`⛏️ Hai lavorato sodo e guadagnato *${guadagno}€*!\n💰 *Nuovo saldo:* ${uDB.money}€`);
        }

        // ── TOP (classifica messaggi) ──────────────────────────────────────────────
        else if (command === 'top') {
            if (!isGroup) return reply("❌ Comando disponibile solo nei gruppi.");
            const chatUsers = db[from] || {};
            const sorted = Object.entries(chatUsers)
                .sort((a, b) => (b[1].msgCount || 0) - (a[1].msgCount || 0))
                .slice(0, 5);

            if (sorted.length === 0) return reply("📭 Nessun dato disponibile.");

            let txt = `╭━━━〔 🏆 *TOP 5 ATTIVI* 〕━━━╮\n`;
            sorted.forEach(([jid, data], i) => {
                const medals = ['🥇', '🥈', '🥉', '４', '５'];
                txt += `┃ ${medals[i]} @${jid.split('@')[0]} ➔ *${data.msgCount || 0}* msg\n`;
            });
            txt += `╰━━━━━━━━━━━━━━━━━━━━━━╯`;
            await sock.sendMessage(from, { text: txt, mentions: sorted.map(([jid]) => jid) });
        }

        // ── RICCHI (classifica soldi) ──────────────────────────────────────────────
        else if (command === 'ricchi') {
            if (!isGroup) return reply("❌ Comando disponibile solo nei gruppi.");
            const chatUsers = db[from] || {};
            const sorted = Object.entries(chatUsers)
                .sort((a, b) => (b[1].money || 0) - (a[1].money || 0))
                .slice(0, 5);

            if (sorted.length === 0) return reply("📭 Nessun dato disponibile.");

            let txt = `╭━━━〔 💎 *TOP 5 RICCHI* 〕━━━╮\n`;
            sorted.forEach(([jid, data], i) => {
                const medals = ['🤑', '💸', '💰', '💵', '🪙'];
                txt += `┃ ${medals[i]} @${jid.split('@')[0]} ➔ *${data.money || 0}€*\n`;
            });
            txt += `╰━━━━━━━━━━━━━━━━━━━━━━╯`;
            await sock.sendMessage(from, { text: txt, mentions: sorted.map(([jid]) => jid) });
        }

        // ── DADI (random puro) ─────────────────────────────────────────────────────
        else if (command === 'dadi') {
            const puntata = parseInt(args[0]);
            if (isNaN(puntata) || puntata <= 0) return reply("⚠️ Specifica una puntata valida.\n👉 *Uso:* `.dadi 50`");

            const uDB = getUser(sender, from);
            if (uDB.money < puntata) return reply("❌ Saldo insufficiente.");

            const userRoll = Math.floor(Math.random() * 6) + 1;
            const botRoll  = Math.floor(Math.random() * 6) + 1;

            let esito;
            if (userRoll > botRoll) {
                uDB.money += puntata;
                esito = `✅ *HAI VINTO!* (+${puntata}€)`;
            } else if (userRoll < botRoll) {
                uDB.money -= puntata;
                esito = `❌ *HAI PERSO!* (-${puntata}€)`;
            } else {
                esito = `🤝 *PAREGGIO!* (0€)`;
            }

            saveDB();
            await reply(
`╭━━━〔 🎲 *LANCIO DADI* 〕━━━╮
┃ 🧑 Tu: *${userRoll}*
┃ 🤖 Bot: *${botRoll}*
┣━━━━━━━━━━━━━━━━━━━━━━
┃ ${esito}
┃ 💰 *Saldo attuale:* ${uDB.money}€
╰━━━━━━━━━━━━━━━━━━━━━━╯`
            );
        }

        // ── SLOT ───────────────────────────────────────────────────────────────────
        else if (command === 'slot') {
            const puntata = 20;
            const uDB     = getUser(sender, from);
            if (uDB.money < puntata) return reply(`❌ Costa *${puntata}€* girare la slot. Saldo attuale: *${uDB.money}€*.`);

            uDB.money -= puntata;
            const icone = ['🍒', '🍋', '🔔', '💎', '🍉'];
            const r     = [0, 1, 2].map(() => icone[Math.floor(Math.random() * icone.length)]);

            let win = 0;
            if (r[0] === r[1] && r[1] === r[2]) win = 200;
            else if (r[0] === r[1] || r[1] === r[2] || r[0] === r[2]) win = 30;

            uDB.money += win;
            saveDB();

            const risultato = win > 0 ? `🎊 *HAI VINTO ${win}€!* 🎊` : `💀 *HAI PERSO ${puntata}€*`;
            
            await reply(
`╭━━━〔 🎰 *SLOT MACHINE* 〕━━━╮
┃
┃    [ ${r[0]} | ${r[1]} | ${r[2]} ]
┃
┣━━━━━━━━━━━━━━━━━━━━━━
┃ ${risultato}
┃ 💰 *Saldo attuale:* ${uDB.money}€
╰━━━━━━━━━━━━━━━━━━━━━━╯`
            );
        }

        // ── ROULETTE ───────────────────────────────────────────────────────────────
        else if (command === 'roulette') {
            const puntata = Number.parseInt(args[0], 10);
            if (!Number.isInteger(puntata) || puntata <= 0) {
                return reply("Scegli una puntata valida. Esempio: .roulette 50");
            }
            const uDB = getUser(sender, from);
            if (uDB.money < puntata) return reply(`Ti mancano soldi: hai ${formatMoney(uDB.money)}.`);

            const win = Math.random() < 0.44;
            uDB.money += win ? puntata : -puntata;
            saveDB();
            await reply(
`╭━━〔 🎡 *ROULETTE* 〕━━╮
┃ Puntata: *${formatMoney(puntata)}*
┃ ${win ? '✨ È uscito il tuo numero. Hai vinto!' : '🫠 Giro storto, questa volta è andata male.'}
┃ Saldo: *${formatMoney(uDB.money)}*
╰━━━━━━━━━━━━━━━━━━╯`);
        }

        // ── SASSO, CARTA, FORBICI ──────────────────────────────────────────────────
        else if (['sasso', 'carta', 'forbici'].includes(command)) {
            const choices = ['sasso', 'carta', 'forbici'];
            const botChoice = randomChoice(choices);
            const beats = { sasso: 'forbici', carta: 'sasso', forbici: 'carta' };
            const result = command === botChoice
                ? '🤝 Pari, ci avete pensato allo stesso modo.'
                : beats[command] === botChoice
                    ? '🥳 Hai vinto, easy.'
                    : '😅 Stavolta vince il bot.';
            await reply(`✊ *Tu:* ${command}\n🤖 *Bot:* ${botChoice}\n\n${result}`);
        }

        // ── SOCIAL & FUN ───────────────────────────────────────────────────────────
        else if (command === 'ship') {
            if (!targetJid) return reply("Tagga qualcuno oppure rispondi a un suo messaggio.");
            const percent = randomInt(1, 100);
            const mood = percent >= 85 ? 'match pazzesco 💘' : percent >= 60 ? 'qui c’è del potenziale ✨' : percent >= 35 ? 'ci vuole un po’ di impegno 😬' : 'meglio restare amici, forse 🫶';
            await sock.sendMessage(from, {
                text: `💞 *SHIP METER*\n\n@${sender.split('@')[0]} + @${targetJid.split('@')[0]}\n\n*${percent}%* — ${mood}`,
                mentions: [sender, targetJid],
            });
        }
        else if (command === 'gay') {
            const person = targetJid || sender;
            const percent = randomInt(1, 100);
            await sock.sendMessage(from, {
                text: `🌈 @${person.split('@')[0]} oggi ha *${percent}%* di energia rainbow. Solo vibes belle.`,
                mentions: [person],
            });
        }
        else if (command === 'simpatometro') {
            const person = targetJid || sender;
            const percent = randomInt(1, 100);
            const note = percent >= 80 ? 'spacca davvero' : percent >= 50 ? 'promosso/a' : 'può fare di meglio';
            await sock.sendMessage(from, {
                text: `😊 *SIMPATOMETRO*\n@${person.split('@')[0]}: *${percent}%* — ${note}.`,
                mentions: [person],
            });
        }
        else if (command === 'percentuale') {
            if (!textArgs) return reply("Dimmi su cosa devo decidere. Esempio: .percentuale vincere domani");
            await reply(`📊 *${textArgs}*\n\nDirei *${randomInt(1, 100)}%*. Ci sta.`);
        }
        else if (command === 'scelta') {
            const options = textArgs.split(/\s+(?:o|oppure)\s+|\s*\|\s*|\s*,\s*/i).map(item => item.trim()).filter(Boolean);
            if (options.length < 2) return reply("Scrivi almeno due opzioni. Esempio: .scelta pizza o sushi");
            await reply(`🎯 Io direi: *${randomChoice(options)}*`);
        }
        else if (command === 'assemblapc') {
            const cpu = randomChoice(['Ryzen 5 7600', 'Ryzen 7 7800X3D', 'Intel i5-14600K', 'Intel i7-14700K']);
            const gpu = randomChoice(['RTX 4060', 'RTX 4070 Super', 'RX 7700 XT', 'RX 7900 GRE']);
            const ram = randomChoice(['16 GB DDR5', '32 GB DDR5', '64 GB DDR5']);
            const storage = randomChoice(['1 TB NVMe', '2 TB NVMe', '1 TB NVMe + 2 TB SSD']);
            await reply(
`╭━━〔 🖥️ *PC DEL GIORNO* 〕━━╮
┃ CPU: *${cpu}*
┃ GPU: *${gpu}*
┃ RAM: *${ram}*
┃ Spazio: *${storage}*
┃
┃ Perfetto per giocare e fare tutto senza stress.
╰━━━━━━━━━━━━━━━━━━━━╯`);
        }
        else if (command === 'personaggio') {
            const role = randomChoice(['Eroe/a del gruppo', 'Mago/a delle scuse', 'Boss finale', 'Spalla comica', 'Leggenda urbana']);
            const power = randomChoice(['arriva sempre al momento giusto', 'trova cibo ovunque', 'fa ridere anche quando non vuole', 'sopravvive a ogni figuraccia', 'sparisce quando c’è da pagare']);
            await sock.sendMessage(from, {
                text: `🎭 *@${sender.split('@')[0]} è:* ${role}\n\nSuperpotere: *${power}*.`,
                mentions: [sender],
            });
        }
        else if (command === 'anime') {
            const anime = randomChoice(['protagonista shōnen', 'villain con un passato triste', 'sensei rilassatissimo', 'personaggio che arriva tardi ma salva tutto', 'best friend che ruba la scena']);
            await sock.sendMessage(from, {
                text: `✨ *@${sender.split('@')[0]} in un anime sarebbe:* ${anime}.\n\nOpening già in playlist, ovvio.`,
                mentions: [sender],
            });
        }
        else if (command === 'verita') {
            await reply(`🗣️ *VERITÀ*\n\n${randomChoice(ARRAYS.verita)}`);
        }
        else if (command === 'obbligo') {
            await reply(`🎯 *OBBLIGO*\n\n${randomChoice(ARRAYS.obbligo)}`);
        }
        else if (command === 'tette') {
            await reply(`🍒 *METRO DELLE CURVE*\n\n${randomChoice(ARRAYS.tette)}`);
        }
        else if (command === 'incinta') {
            if (!targetJid) return reply("Tagga una persona oppure rispondi a un suo messaggio.");
            const percent = randomInt(1, 100);
            await sock.sendMessage(from, {
                text: `🍼 *TEST DI FANTASIA*\n\n@${targetJid.split('@')[0]} oggi risulta al *${percent}%* incinta/o. È solo un gioco eh 😭`,
                mentions: [targetJid],
            });
        }

        // ── FIORE ──────────────────────────────────────────────────────────────────
        else if (command === 'fiore') {
            const recipient = targetJid || sender;
            const flower = randomChoice(ARRAYS.fiori);
            await sock.sendMessage(from, {
                text: `🌷 *UN FIORE PER TE*\n\n@${sender.split('@')[0]} regala a @${recipient.split('@')[0]} ${flower} ✨`,
                mentions: [sender, recipient],
            }, { quoted: msg });
        }

        // ── ORGASMO (Audio Casuale) ────────────────────────────────────────────────
        else if (command === 'meme') {
            const audioDir = path.join(__dirname, 'audio');
            
            // Verifica se la cartella esiste
            if (!fs.existsSync(audioDir)) {
                return reply("❌ *Errore:* La cartella `/audio` non esiste nel sistema.");
            }
            
            // Invia un MP3 come file audio: una nota vocale deve essere OGG/Opus,
            // mentre dichiarare un MP3 come audio/mp4 fa apparire “non disponibile”.
            const files = fs.readdirSync(audioDir)
                .filter(file => path.extname(file).toLowerCase() === '.mp3');
            
            if (files.length === 0) {
                return reply("📭 *Errore:* Nessun file `.mp3` trovato nella cartella `/audio`.");
            }
            
            // Sceglie un file audio a caso
            const randomAudio = files[Math.floor(Math.random() * files.length)];
            const audioPath = path.join(audioDir, randomAudio);

            try {
                const audioBuffer = fs.readFileSync(audioPath);
                if (audioBuffer.length === 0) throw new Error('File audio vuoto');

                await sock.sendMessage(from, {
                    audio: audioBuffer,
                    mimetype: 'audio/mpeg',
                    fileName: randomAudio,
                    ptt: false,
                }, { quoted: msg });
            } catch (e) {
                console.error('[meme]', e.message);
                await reply("❌ *Errore:* Impossibile inviare l'audio.");
            }
        }

        // ── INTERAZIONI ────────────────────────────────────────────────────────────
        else if (['schiaffo', 'paccasulculo', 'uccidi', 'insulta', 'scopa', 'sborra', 'ditalino', 'sega', 'bacia', 'abbraccia', 'sposa'].includes(command)) {
            if (!targetJid) return reply("Tagga qualcuno oppure rispondi a un suo messaggio.");

            let text;
            if (command === 'schiaffo') {
                text = `💥 @${sender.split('@')[0]} ${randomChoice(ARRAYS.schiaffi)} @${targetJid.split('@')[0]}`;
            } else if (command === 'insulta') {
                text = `🤬 @${targetJid.split('@')[0]}:\n*«${randomChoice(ARRAYS.insulti)}»*`;
            } else if (command === 'paccasulculo') {
                text = `🍑 @${sender.split('@')[0]} ${randomChoice(ARRAYS.paccasulculo)} @${targetJid.split('@')[0]}.`;
            } else if (command === 'uccidi') {
                text = `🎮 @${sender.split('@')[0]} ${randomChoice(ARRAYS.uccidi)} @${targetJid.split('@')[0]}. GG!`;
            } else if (command === 'bacia') {
                text = `💋 @${sender.split('@')[0]} ${randomChoice(ARRAYS.bacia)} @${targetJid.split('@')[0]}.`;
            } else if (command === 'abbraccia') {
                text = `🫂 @${sender.split('@')[0]} ${randomChoice(ARRAYS.abbraccia)} @${targetJid.split('@')[0]}.`;
            } else if (command === 'sposa') {
                text = `💍 @${sender.split('@')[0]} ${randomChoice(ARRAYS.sposa)} @${targetJid.split('@')[0]}. Il gruppo aspetta la risposta!`;
            } else if (command === 'scopa') {
                text = `🔞 @${sender.split('@')[0]} ${randomChoice(ARRAYS.scopa)} @${targetJid.split('@')[0]}.`;
            } else {
                text = `🔥 @${sender.split('@')[0]} ${randomChoice(ARRAYS.caos)} @${targetJid.split('@')[0]}. Fine dei dettagli, siamo in chat 😭`;
            }
            await sock.sendMessage(from, { text, mentions: [sender, targetJid] });
        }

        // ── UTILITY ─────────────────────────────────────────────────────────────────
        else if (command === 'weather') {
            if (!textArgs) return reply("Scrivi una città. Esempio: .weather Milano");
            try {
                const { data } = await axios.get(`https://wttr.in/${encodeURIComponent(textArgs)}?format=j1`, { timeout: 10_000 });
                const current = data.current_condition?.[0];
                const area = data.nearest_area?.[0];
                if (!current) throw new Error('Dati meteo non disponibili');
                const city = area?.areaName?.[0]?.value || textArgs;
                const description = current.weatherDesc?.[0]?.value || 'N/D';
                await reply(
`╭━━〔 🌦️ *METEO* 〕━━╮
┃ 📍 *${city}*
┃ 🌡️ ${current.temp_C}°C — ${description}
┃ 💧 Umidità: ${current.humidity}%
┃ 🌬️ Vento: ${current.windspeedKmph} km/h
╰━━━━━━━━━━━━━━━━━━╯`);
            } catch (_) {
                await reply("Non trovo il meteo di questa città. Riprova con un nome più preciso.");
            }
        }
        else if (command === 'lyrics') {
            if (!textArgs) return reply("Scrivi titolo e artista. Esempio: .lyrics Blinding Lights The Weeknd");
            try {
                const search = await axios.get('https://itunes.apple.com/search', {
                    params: { term: textArgs, entity: 'song', limit: 1 },
                    timeout: 10_000,
                });
                const song = search.data?.results?.[0];
                if (!song) return reply("Non ho trovato quella canzone.");
                const lyricsResponse = await axios.get(
                    `https://api.lyrics.ovh/v1/${encodeURIComponent(song.artistName)}/${encodeURIComponent(song.trackName)}`,
                    { timeout: 10_000 }
                );
                const lyrics = lyricsResponse.data?.lyrics?.trim();
                if (!lyrics) return reply(`Ho trovato *${song.trackName}*, ma il testo non è disponibile.`);
                await reply(`🎤 *${song.trackName}* — _${song.artistName}_\n\n${lyrics.slice(0, 6000)}${lyrics.length > 6000 ? '\n\n…testo tagliato qui.' : ''}`);
            } catch (_) {
                await reply("Non riesco a recuperare il testo in questo momento. Riprova più tardi.");
            }
        }
        else if (command === 'hack') {
            if (!targetJid) return reply("Tagga una persona: è solo una scenetta, promesso.");
            const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            try {
                const fake = await sock.sendMessage(from, {
                    text: `💻 Avvio la scenetta su @${targetJid.split('@')[0]}…`,
                    mentions: [targetJid],
                }, { quoted: msg });
                await pause(700);
                await sock.sendMessage(from, { text: '🔎 Cerco meme compromettenti…', edit: fake.key });
                await pause(700);
                await sock.sendMessage(from, { text: '📦 Recupero un sacco di figuracce…', edit: fake.key });
                await pause(700);
                await sock.sendMessage(from, {
                    text: `✅ Fatto. @${targetJid.split('@')[0]} è stato/a hackerato/a… per finta 😭`,
                    edit: fake.key,
                    mentions: [targetJid],
                });
            } catch (_) {
                await reply("La scenetta si è impallata, riprova.");
            }
        }
        else if (command === 'clona') {
            if (!textArgs) return reply("Scrivi qualcosa da girare al contrario. Esempio: .clona ciao");
            await reply(`🪞 ${Array.from(textArgs).reverse().join('')}`);
        }
        else if (command === 'vv') {
            const quoted = contextInfo.quotedMessage;
            const viewOnce = quoted?.viewOnceMessageV2?.message || quoted?.viewOnceMessage?.message || quoted?.viewOnceMessageV2Extension?.message;
            if (!viewOnce || (!viewOnce.imageMessage && !viewOnce.videoMessage)) {
                return reply("Rispondi a una foto o a un video ‘visualizza una volta’.");
            }
            try {
                const buffer = await downloadMediaMessage(
                    { key: getQuotedKey(from, contextInfo), message: viewOnce },
                    'buffer',
                    {},
                    { logger: pino({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage }
                );
                const media = viewOnce.imageMessage
                    ? { image: buffer, caption: '👁️ Eccola qui.' }
                    : { video: buffer, caption: '👁️ Eccolo qui.' };
                await sock.sendMessage(from, media, { quoted: msg });
            } catch (error) {
                console.error('[vv]', error.message);
                await reply("Non riesco a recuperare questo contenuto. Forse non è più disponibile.");
            }
        }

        // ── AMMINISTRAZIONE GRUPPO ──────────────────────────────────────────────────
        else if (command === 'tagall') {
            if (!isGroup) return reply("Questo comando funziona solo nei gruppi.");
            if (!isSenderAdmin) return reply("Questo comando è per gli admin del gruppo.");
            try {
                const meta = await sock.groupMetadata(from);
                const participants = meta.participants.map(participant => participant.id);
                const message = textArgs || 'Ehi raga, un secondo di attenzione 👀';
                const tags = participants.map(id => `@${id.split('@')[0]}`).join('\n');
                await sock.sendMessage(from, { text: `📣 *ANNUNCIO*\n${message}\n\n${tags}`, mentions: participants });
            } catch (_) {
                await reply("Non riesco a leggere i partecipanti del gruppo.");
            }
        }
        else if (command === 'chiudi' || command === 'apri') {
            if (!isGroup) return reply("Questo comando funziona solo nei gruppi.");
            if (!isSenderAdmin) return reply("Questo comando è per gli admin del gruppo.");
            if (!isBotAdmin) return reply("Prima rendimi amministratore, così posso farlo.");
            try {
                const closed = command === 'chiudi';
                await sock.groupSettingUpdate(from, closed ? 'announcement' : 'not_announcement');
                await reply(closed ? "🔒 Gruppo chiuso. Ora possono scrivere solo gli admin." : "🔓 Gruppo riaperto. Tutti possono scrivere di nuovo.");
            } catch (_) {
                await reply("Non riesco a cambiare l’impostazione del gruppo.");
            }
        }
        else if (command === 'ban') {
            if (!isGroup) return reply("Questo comando funziona solo nei gruppi.");
            if (!isSenderAdmin) return reply("Questo comando è per gli admin del gruppo.");
            if (!isBotAdmin) return reply("Prima rendimi amministratore, così posso farlo.");
            if (!targetJid) return reply("Tagga la persona da rimuovere.");
            if (targetJid === sender) return reply("Non puoi rimuovere te stesso/a con il bot.");
            try {
                await sock.groupParticipantsUpdate(from, [targetJid], 'remove');
                await sock.sendMessage(from, { text: `👋 @${targetJid.split('@')[0]} è stato/a rimosso/a dal gruppo.`, mentions: [targetJid] });
            } catch (_) {
                await reply("Non riesco a rimuovere questa persona. Controlla i permessi del bot.");
            }
        }
        else if (command === 'del') {
            if (!isReply || !contextInfo.stanzaId) return reply("Rispondi al messaggio che vuoi eliminare.");
            if (isGroup && !isSenderAdmin) return reply("Questo comando è per gli admin del gruppo.");
            if (isGroup && !isBotAdmin) return reply("Prima rendimi amministratore, così posso eliminare i messaggi.");
            try {
                await sock.sendMessage(from, { delete: getQuotedKey(from, contextInfo) });
            } catch (_) {
                await reply("Non riesco a eliminare quel messaggio.");
            }
        }
        else if (command === 'mute' || command === 'unmute') {
            if (!isGroup) return reply("Questo comando funziona solo nei gruppi.");
            if (!isSenderAdmin) return reply("Questo comando è per gli admin del gruppo.");
            if (!isBotAdmin) return reply("Prima rendimi amministratore: mi serve per eliminare i messaggi del mute.");
            if (!targetJid) return reply("Tagga la persona interessata.");
            const targetData = getUser(targetJid, from);
            targetData.isMuted = command === 'mute';
            saveDB();
            await sock.sendMessage(from, {
                text: command === 'mute'
                    ? `🔇 @${targetJid.split('@')[0]} è in pausa dal gruppo.`
                    : `🔊 @${targetJid.split('@')[0]} può scrivere di nuovo.`,
                mentions: [targetJid],
            });
        }
        else if (command === 'warn') {
            if (!isGroup) return reply("Questo comando funziona solo nei gruppi.");
            if (!isSenderAdmin) return reply("Questo comando è per gli admin del gruppo.");
            if (!isBotAdmin) return reply("Prima rendimi amministratore, così posso gestire gli avvisi.");
            if (!targetJid) return reply("Tagga la persona da avvisare.");
            const targetData = getUser(targetJid, from);
            targetData.warnings += 1;
            if (targetData.warnings >= 3) {
                try {
                    await sock.groupParticipantsUpdate(from, [targetJid], 'remove');
                    targetData.warnings = 0;
                    await sock.sendMessage(from, { text: `⛔ @${targetJid.split('@')[0]} ha raggiunto 3 avvisi ed è stato/a rimosso/a.`, mentions: [targetJid] });
                } catch (_) {
                    targetData.warnings = 2;
                    await reply("Ha raggiunto 3 avvisi, ma non riesco a rimuoverlo/a. Controlla i miei permessi.");
                }
            } else {
                await sock.sendMessage(from, { text: `⚠️ @${targetJid.split('@')[0]} ha ricevuto un avviso. *${targetData.warnings}/3*`, mentions: [targetJid] });
            }
            saveDB();
        }
        else if (command === 'casino') {
            await reply("🎰 Per giocare usa .dadi [puntata], .slot oppure .roulette [puntata]. Buona fortuna, ma senza vendere il divano 😭");
        }

        // ── STICKER ────────────────────────────────────────────────────────────────
        else if (command === 'sticker' || command === 's') {
            const directMedia = msg.message.imageMessage || msg.message.videoMessage;
            const quotedMedia = contextInfo.quotedMessage?.imageMessage || contextInfo.quotedMessage?.videoMessage;

            if (!directMedia && !quotedMedia) {
                return reply("Invia o rispondi a un’immagine o a un video per creare uno sticker.");
            }

            try {
                const targetMsg = quotedMedia ? contextInfo.quotedMessage : msg.message;
                const mediaKey = quotedMedia ? getQuotedKey(from, contextInfo) : msg.key;
                const buffer = await downloadMediaMessage(
                    { key: mediaKey, message: targetMsg },
                    'buffer',
                    {},
                    { logger: pino({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage }
                );

                const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                const tmpInput = path.join(__dirname, `sticker_${stamp}.${(directMedia || quotedMedia).mimetype?.includes('video') ? 'mp4' : 'jpg'}`);
                const tmpWebp = path.join(__dirname, `sticker_${stamp}.webp`);
                fs.writeFileSync(tmpInput, buffer);

                try {
                    await execFileAsync('ffmpeg', [
                        '-y', '-i', tmpInput,
                        '-vcodec', 'libwebp',
                        '-filter:v', 'fps=15,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:-1:-1:color=0x00000000',
                        '-lossless', '1', '-loop', '0', '-an', '-vsync', '0',
                        tmpWebp,
                    ]);
                    await sock.sendMessage(from, { sticker: fs.readFileSync(tmpWebp) }, { quoted: msg });
                } finally {
                    [tmpInput, tmpWebp].forEach(file => {
                        try { if (fs.existsSync(file)) fs.unlinkSync(file); } catch (_) {}
                    });
                }
            } catch (e) {
                console.error('[sticker]', e.message);
                await reply("Non riesco a creare lo sticker. Controlla che FFmpeg sia installato e riprova.");
            }
        }

        // ── DEFAULT FALLBACK (Fine del blocco try) ─────────────────────────────────
        } catch (error) {
            console.error('[handler] Errore non gestito:', error.message);
            try { await reply("⚠️ Si è verificato un errore interno. Riprova."); } catch (_) {}
        }
    });
}

startBot();
