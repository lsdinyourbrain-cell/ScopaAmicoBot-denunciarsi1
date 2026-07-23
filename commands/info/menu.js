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
┃  ├ .cassaforte💰 .scava⛏ .casino€ .dadi€ .slot🎰
┃  ├ .roulette€ .sasso .top🏆 .ricchi💎
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  🎲 𝕊𝕠𝕔𝕚𝕒𝕝
┃  ├ .ship .gay .simpatometro .percentuale .scelta .fiore
┃  ├ .personaggio .anime .assemblapc .verita .obbligo
┃  ├ .oroscopo .maranza💪
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  🔥 𝕀𝕟𝕥𝕖𝕣𝕒𝕫𝕚𝕠𝕟𝕚
┃  ├ .schiaffo .bacia .abbraccia .sposa .paccasulculo
┃  ├ .uccidi .insulta .scopa .sborra .ditalino .sega
┃  ├ .incinta .tette🍒 .meme🎵 .rissa🥊 .cazzo🍆
┃  ├ .sclero💢 .drink🍹 .scusa .palo🥀 .gossip🗣
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  🛠️ 𝕌𝕥𝕚𝕝𝕚𝕥𝕪
┃  ├ .ping⚡ .groupinfo🏷 .weather🌦 .sticker/.s🖼
┃  ├ .vv👁 .hack💻 .clona🪞 .tts🔊 .chipmunk🐿
┃  ├ .rubato🖼 .lyrics🎤
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  🎤 𝔄𝔲𝔡𝔦𝔬
┃  ├ .deep .reverse .echo .robot .drunk .bass
┃  ├ .nightcore .8d
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  📥 𝕄𝕖𝕕𝕚𝕒
┃  ├ .ig📸 .wasted💀 .pokedex📋 .clown🤡
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  🤖 𝔸𝕀
┃  ╰ .ai [domanda] 🧠
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  🎮 𝔾𝕚𝕠𝕔𝕙𝕚
┃  ╰ .tris @ 🎯
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  ⚙️ 𝔄𝔡𝔪𝔦𝔫
┃  ├ .tag .tagall .chiudi/apri .ban .link .del
┃  ├ .mute/unmute .warn .promote/demote
${antilinkSection}`;

            if (isOwner) {
                menuTxt +=
`┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  🛡 𝔒𝔴𝔫𝔢𝔯
┃  ├ .spegni .accendi .riavvia
┃  ╰ .welcome on/off .goodbye on/off`;
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
