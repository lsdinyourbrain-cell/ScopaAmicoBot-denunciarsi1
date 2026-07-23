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
                const alLines = Object.keys(ANTILINK_PLATFORMS).map(p =>
                    `│   ${alCfg[p] ? '🟢' : '⚫'} ${p.padEnd(11)}→ *${alCfg[p] ? 'ON' : 'OFF'}*`
                ).join('\n');
                antilinkSection =
`│
╞══════════════════════════════════════╡
│  🔗 𝐀𝐧𝐭𝐢𝐥𝐢𝐧𝐤 _(Owner)_
│
${alLines}
│
│  📌 .antilink [piattaforma] [on/off]
│  📌 .antilink tutti on/off`;
            } else {
                antilinkSection =
`│
╞══════════════════════════════════════╡
│  🔗 *ANTILINK*
│  ℹ️ Solo nei gruppi.`;
            }

            const now = new Date();
            const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
            const dateStr = now.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' });

            let menuTxt =
`╭━━━ 𝐒𝐜𝐨𝐩𝐚𝐀𝐦𝐢𝐜𝐨 𝐁𝐎𝐓 v8.0 ━━━
┃
┃ 👋 *${pushName.slice(0, 16)}* • 🕐${timeStr} ${dateStr}
┃
┣━━ 💝 𝐅𝐚𝐦𝐢𝐠𝐥𝐢𝐚
┃ ╰ .famiglia [sposa/adotta/caccia/divorzia/abbandona]
┣━━ 🪙 𝐄𝐜𝐨𝐧𝐨𝐦𝐢𝐚
┃ ├ .cassaforte💰 .scava⛏ .casino€ .dadi€ .slot🎰
┃ ├ .roulette€ .sasso .top🏆 .ricchi💎
┣━━ 🎲 𝐒𝐨𝐜𝐢𝐚𝐥
┃ ├ .ship .gay .simpatometro .percentuale .scelta .fiore
┃ ├ .personaggio .anime .assemblapc .verita .obbligo
┃ ├ .oroscopo .maranza💪
┣━━ 🔥 𝐈𝐧𝐭𝐞𝐫𝐚𝐳𝐢𝐨𝐧𝐢
┃ ├ .schiaffo .bacia .abbraccia .sposa .paccasulculo
┃ ├ .uccidi .insulta .scopa .sborra .ditalino .sega
┃ ├ .incinta .tette🍒 .meme🎵 .rissa🥊 .cazzo🍆
┃ ├ .sclero💢 .drink🍹 .scusa .palo🥀 .gossip🗣
┣━━ 🛠️ 𝐔𝐭𝐢𝐥𝐢𝐭𝐲
┃ ├ .ping⚡ .groupinfo🏷 .weather🌦 .sticker/.s🖼
┃ ├ .vv👁 .hack💻 .clona🪞 .tts🔊 .chipmunk🐿
┃ ├ .rubato🖼 .lyrics🎤
┣━━ 🎤 𝐀𝐮𝐝𝐢𝐨 🔊
┃ ├ .deep .reverse .echo .robot .drunk .bass
┃ ├ .nightcore .8d
┣━━ 📥 𝐌𝐞𝐝𝐢𝐚
┃ ├ .ig📸 .wasted💀 .pokedex📋 .clown🤡
┣━━ 🤖 𝐀𝐈 🧠
┃ ╰ .ai [domanda]
┣━━ 🎮 𝐆𝐢𝐨𝐜𝐡𝐢 🎯
┃ ╰ .tris @
┣━━ ⚙️ 𝐀𝐝𝐦𝐢𝐧
┃ ├ .tag .tagall .chiudi/apri .ban .link .del
┃ ├ .mute/unmute .warn .promote/demote
${antilinkSection}`;

            if (isOwner) {
                menuTxt +=
`┃
┣━━ 🛡 𝐎𝐰𝐧𝐞𝐫
┃ ├ .spegni .accendi .riavvia
┃ ├ .welcome on/off .goodbye on/off`;
            }

            menuTxt +=
`┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

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
