'use strict';

module.exports = {
    name: 'menu',
    aliases: [],
    description: "Esegue il comando .menu.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, pushName, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            let pfpUrl;
            try { pfpUrl = await sock.profilePictureUrl(from, 'image'); } catch (_) { pfpUrl = null; }

            let antilinkSection;
            if (isGroup) {
                const alCfg         = getAntilinkGroup(from);
                const platformNames = Object.keys(ANTILINK_PLATFORMS);
                const alLines = platformNames.map(p => {
                    const dot   = alCfg[p] ? '🟢' : '⚫';
                    const stato = alCfg[p] ? 'ON' : 'OFF';
                    return `│   ${dot}  ${p.padEnd(11)}→  *${stato}*`;
                }).join('\n');

                antilinkSection =
`│
╞══════════════════════════════════════╡
│  🔗  *ANTILINK*  _(solo Owner)_
│
${alLines}
│
│  📌  *.antilink [piattaforma] [on/off]*
│  📌  *.antilink tutti on/off*`;
            } else {
                antilinkSection =
`│
╞══════════════════════════════════════╡
│  🔗  *ANTILINK*
│  ℹ️  Disponibile solo nei gruppi.`;
            }

            const now      = new Date();
            const timeStr  = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
            const dateStr  = now.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long' });

            let menuTxt = 
`╭━━━ 🤖 *ScopaAmico BOT* • v7.0 ━━━
┃
┃ 👋 Ciao, *${pushName.slice(0, 18)}*!
┃ 🕐 ${timeStr} • ${dateStr}
┃
┣━━ 💝 *FAMIGLIA*
┃ ├ .famiglia » Albero
┃ ├ .famiglia sposa @ » Matrimonio
┃ ├ .famiglia adotta @ » Adozione
┃ ├ .famiglia divorzia » Divorzio
┃ ├ .famiglia caccia @ » Diseredazione
┃ ╰ .famiglia abbandona
┃
┣━━ 🪙 *ECONOMIA & GIOCHI*
┃ ├ .cassaforte » 💰 Saldo
┃ ├ .scava » ⛏️ Guadagna
┃ ├ .casino [€] » 🃏 Blackjack
┃ ├ .top » 🏆 Attivi
┃ ├ .ricchi » 💎 Classifica
┃ ├ .dadi [€] » 🎲 Lancia
┃ ├ .slot » 🎰 Machine
┃ ├ .roulette [€] » 🎡 Rischia
┃ ╰ .sasso / .carta / .forbici
┃
┣━━ 🎲 *SOCIAL & FUN*
┃ ├ .ship @ » 💞 Match
┃ ├ .gay [@] » 🌈 Metro
┃ ├ .simpatometro [@] » 😊 Score
┃ ├ .percentuale [x] » 📊 Stima
┃ ├ .scelta A o B » 🎯 Decide
┃ ├ .fiore [@] » 🌷 Regalo
┃ ├ .personaggio » 🎭 RPG
┃ ├ .anime » ✨ Profilo
┃ ├ .assemblapc » 🖥️ Build
┃ ├ .verita » 🗣️ Gioco
┃ ├ .obbligo » 🎯 Gioco
┃ ├ .oroscopo » 🔮 Segno
┃ ╰ .maranza 💪 » Flessioni
┃
┣━━ 🔥 *INTERAZIONI*
┃ ├ .schiaffo @ » 💥 Slap
┃ ├ .bacia @ » 💋 Bacio
┃ ├ .abbraccia @ » 🫂 Abbraccio
┃ ├ .sposa @ » 💍 Proposta
┃ ├ .paccasulculo @ » 🍑 Pacca
┃ ├ .uccidi @ » 🎮 KO
┃ ├ .insulta @ » 🤬 Insulto
┃ ├ .incinta @ » 🍼 Test
┃ ├ .scopa @ » 🔞 Azione
┃ ├ .sborra/ditalino/sega @
┃ ├ .tette » 🍒 Valuta
┃ ├ .meme » 🎵 Audio
┃ ├ .rissa @ » 🥊 Rissa
┃ ├ .cazzo @ » 🍆 Misura
┃ ├ .sclero » 💢 Sbrocca
┃ ├ .drink @ » 🍹 Offri
┃ ├ .scusa @ » 🙏 Chiedi scusa
┃ ├ .palo @ » 🥀 Secco
┃ ╰ .gossip @ » 🗣️ Gossip
┃
┣━━ 🛠️ *UTILITY*
┃ ├ .ping » ⚡ Status
┃ ├ .groupinfo » 🏷️ Gruppo
┃ ├ .weather [città] » 🌦️ Meteo
┃ ├ .lyrics [brano] » 🎤 Testo
┃ ├ .sticker / .s » 🖼️ Sticker
┃ ├ .vv » 👁️ Rivela
┃ ├ .hack @ » 💻 Scenetta
┃ ├ .clona [testo] » 🪞 Inverti
┃ ├ .tts [testo] » 🔊 Text-to-Speech
┃ ├ .chipmunk » 🐿️ Voce scoiattolo
┃ ╰ .rubato » 🖼️ Sticker a immagine
┃
┣━━ 🎤 *EFFETTI AUDIO*
┃ ├ .deep » 🔊 Voce profonda
┃ ├ .reverse » ⏪ Audio inverso
┃ ├ .echo » 🏔️ Riverbero
┃ ├ .robot » 🤖 Vocoder
┃ ├ .drunk » 🍻 Ubriaco
┃ ├ .bass » 🔊 Bass boost
┃ ├ .nightcore » ⚡ Speed up
┃ ╰ .8d » 🎧 Audio 8D
┃
┣━━ 📥 *MEDIA & DOWNLOAD*
┃ ├ .ig [url] » 📸 Instagram
┃ ├ .wasted @ » 💀 Filtro GTA
┃ ├ .pokedex @ » 📋 Scheda Pokémon
┃ ╰ .clown @ » 🤡 Filtro pagliaccio
┃
┣━━ 🤖 *INTELLIGENZA ARTIFICIALE*
┃ ╰ .ai [domanda] » 🧠 Chat AI
┃
┣━━ 🎮 *GIOCHI DI GRUPPO*
┃ ╰ .tris @ » ❌⭕ Tic-Tac-Toe
┃
┣━━ ⚙️ *ADMIN* _(solo admin)_
┃ ├ .tag [msg] » 🏷️ Hidetag
┃ ├ .tagall » 📢 Menziona
┃ ├ .chiudi / .apri » 🔒 Chat lock
┃ ├ .ban @ » 🔨 Espelli
┃ ├ .link » 🔗 Invito gruppo
┃ ├ .del » 🗑️ Elimina
┃ ├ .mute / .unmute @ » 🔇 Silenzia
┃ ├ .warn @ » ⚠️ Avviso ×3
┃ ├ .promote @ » 👑 Promuovi admin
┃ ╰ .demote @ » ⬇️ Degrada admin
${antilinkSection}`;

            if (isOwner) {
                menuTxt +=
`┃
┣━━ 👨‍💻 *OWNER* _(riservato)_
┃ ├ .spegni » 🛑 Sospendi
┃ ├ .accendi » ✅ Riattiva
┃ ├ .riavvia » 🔄 Restart
┃ ├ .welcome on/off » 🎉 Benvenuto
┃ ╰ .goodbye on/off » 👋 Arrivederci`;
            }

            menuTxt += 
`┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

            if (pfpUrl) {
                await sock.sendMessage(from, 
                    { image: { url: pfpUrl }, caption: menuTxt }, 
                    { quoted: msg }
                );
            } else {
                await reply(menuTxt);
            }
    },
};
