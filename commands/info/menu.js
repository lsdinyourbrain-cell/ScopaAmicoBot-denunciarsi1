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
                const alCfg = getAntilinkGroup(from);
                const keys = Object.keys(ANTILINK_PLATFORMS);
                const mid = Math.ceil(keys.length / 2);
                const alLine1 = keys.slice(0, mid).map(p => `${alCfg[p] ? '🟢' : '⚫'} ${p}`).join('  ');
                const alLine2 = keys.slice(mid).map(p => `${alCfg[p] ? '🟢' : '⚫'} ${p}`).join('  ');
                antilinkSection =
`┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  🔗 𝔄𝔫𝔱𝔦𝔩𝔦𝔫𝔨  (Owner)
┃  ├ ${alLine1}
┃  ├ ${alLine2}
┃  ╰ .antilink [piattaforma] [on/off]`;
            } else {
                antilinkSection =
`┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  🔗 *ANTILINK*
┃  ╰ Solo nei gruppi.`;
            }

            const now = new Date();
            const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
            const dateStr = now.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' });

            let menuTxt =
`╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  𝓢𝓬𝓸𝓹𝓪𝓐𝓶𝓲𝓬𝓸 𝓑𝓞𝓣  v8.0
┃  👋 *${pushName.slice(0, 16)}*  •  🕐${timeStr} ${dateStr}
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  💝 𝔉𝔞𝔪𝔦𝔤𝔩𝔦𝔞
┃  ╰ .famiglia [sposa/adotta/caccia/divorzia/abbandona]
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  🪙 𝔼𝕔𝕠𝕟𝕠𝕞𝕚𝕒
┃  ├ .cassaforte » 💰 saldo
┃  ├ .scava » ⛏️ miniera
┃  ├ .casino [€] » 🃏 blackjack
┃  ├ .dadi [€] » 🎲 tira
┃  ├ .slot » 🎰 machine
┃  ├ .roulette [€] » 🎡 azzarda
┃  ├ .sasso / .carta / .forbici
┃  ├ .top » 🏆 classifica
┃  ╰ .ricchi » 💎 graduatoria
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  🎲 𝕊𝕠𝕔𝕚𝕒𝕝
┃  ├ .ship » 💞 match
┃  ├ .gay » 🌈 metro
┃  ├ .simpatometro » 😊 score
┃  ├ .percentuale » 📊 stima
┃  ├ .scelta » 🎯 decide
┃  ├ .fiore » 🌷 regalo
┃  ├ .personaggio » 🎭 rpg
┃  ├ .anime » ✨ profilo
┃  ├ .assemblapc » 🖥️ build
┃  ├ .verita » 🗣️ gioco
┃  ├ .obbligo » 🎯 gioco
┃  ├ .oroscopo » 🔮 segno
┃  ╰ .maranza » 💪 flessioni
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  🔥 𝕀𝕟𝕥𝕖𝕣𝕒𝕫𝕚𝕠𝕟𝕚
┃  ├ .schiaffo » 💥 slap
┃  ├ .bacia » 💋 bacio
┃  ├ .abbraccia » 🫂 abbraccio
┃  ├ .sposa » 💍 proposta
┃  ├ .paccasulculo » 🍑 pacca
┃  ├ .uccidi » 🎮 ko
┃  ├ .insulta » 🤬 insulto
┃  ├ .scopa » 🔞 azione
┃  ├ .sborra » 💦 sborra
┃  ├ .ditalino » 👆 ditalino
┃  ├ .sega » ✊ sega
┃  ├ .incinta » 🍼 test
┃  ├ .tette » 🍒 valuta
┃  ├ .meme » 🎵 audio
┃  ├ .rissa » 🥊 rissa
┃  ├ .cazzo » 🍆 misura
┃  ├ .sclero » 💢 sbrocca
┃  ├ .drink » 🍹 offri
┃  ├ .scusa » 🙏 scusa
┃  ├ .palo » 🥀 secco
┃  ╰ .gossip » 🗣️ gossip
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  🛠️ 𝕌𝕥𝕚𝕝𝕚𝕥𝕪
┃  ├ .ping » ⚡ status
┃  ├ .groupinfo » 🏷️ gruppo
┃  ├ .weather [città] » 🌦️ meteo
┃  ├ .sticker / .s » 🖼️ sticker
┃  ├ .vv » 👁️ rivela
┃  ├ .hack » 💻 scenetta
┃  ├ .clona [testo] » 🪞 inverti
┃  ├ .tts [testo] » 🔊 tts
┃  ├ .chipmunk » 🐿️ scoiattolo
┃  ├ .rubato » 🖼️ img→sticker
┃  ╰ .lyrics [brano] » 🎤 testo
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  🎤 𝔄𝔲𝔡𝔦𝔬
┃  ├ .deep » 🔊 profonda
┃  ├ .reverse » ⏪ inverso
┃  ├ .echo » 🏔️ riverbero
┃  ├ .robot » 🤖 vocoder
┃  ├ .drunk » 🍻 ubriaco
┃  ├ .bass » 🔊 bass boost
┃  ├ .nightcore » ⚡ speed up
┃  ╰ .8d » 🎧 8d audio
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  📥 𝕄𝕖𝕕𝕚𝕒
┃  ├ .ig [url] » 📸 instagram
┃  ├ .wasted » 💀 filtro gta
┃  ├ .pokedex » 📋 scheda
┃  ╰ .clown » 🤡 pagliaccio
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  🤖 𝔸𝕀
┃  ╰ .ai [domanda] » 🧠 chat ai
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  🎮 𝔾𝕚𝕠𝕔𝕙𝕚
┃  ╰ .tris @ » ❌⭕ tic tac toe
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  ⚙️ 𝔄𝔡𝔪𝔦𝔫
┃  ├ .tag [msg] » 🏷️ hidetag
┃  ├ .tagall » 📢 menziona
┃  ├ .chiudi / .apri » 🔒 chat lock
┃  ├ .ban @ » 🔨 espelli
┃  ├ .link » 🔗 invito
┃  ├ .del » 🗑️ elimina
┃  ├ .mute / .unmute @ » 🔇 silenzia
┃  ├ .warn @ » ⚠️ avviso ×3
┃  ╰ .promote / .demote @ » 👑 admin
${antilinkSection}`;

            if (isOwner) {
                menuTxt +=
`┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  🛡 𝔒𝔴𝔫𝔢𝔯
┃  ├ .spegni » 🛑 sospendi
┃  ├ .accendi » ✅ riattiva
┃  ├ .riavvia » 🔄 restart
┃  ├ .welcome on/off » 🎉 benvenuto
┃  ╰ .goodbye on/off » 👋 arrivederci`;
            }

            menuTxt +=
`┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

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
