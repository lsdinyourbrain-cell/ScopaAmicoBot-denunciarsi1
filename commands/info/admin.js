'use strict';

module.exports = {
    name: 'admin',
    aliases: [],
    description: "Mostra gli admin del gruppo e i comandi admin.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, pushName, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!isGroup) return reply("Questo comando funziona solo nei gruppi.");

            let admins = [];
            try {
                const meta = await sock.groupMetadata(from);
                admins = (meta?.participants || []).filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            } catch (e) {
                return reply("Non riesco a leggere gli admin del gruppo.");
            }

            const adminList = admins.length > 0
                ? admins.map(a => `┃  👑 @${(a.id || a.jid || a).split('@')[0]}`).join('\n')
                : '┃  _(nessun admin)_';

            const text =
`╔══════════════════════════════════════╗
║     👑 *𝔄𝔡𝔪𝔦𝔫 𝔊𝔯𝔲𝔭𝔭𝔬* 👑
╠══════════════════════════════════════╣
║
${adminList}
║
╠══════════════════════════════════════╣
║ ⚙️ *ℭ𝔬𝔪𝔞𝔫𝔡𝔦 𝔄𝔡𝔪𝔦𝔫*
║
║  🢒 📢 .tag
║  🢒 📣 .tagall
║  🢒 🔒 .chiudi / 🔓 .apri
║  🢒 🚫 .ban
║  🢒 🔗 .link
║  🢒 🗑️ .del
║  🢒 🔇 .mute / 🔊 .unmute
║  🢒 ⚠️ .warn
║  🢒 👑 .promote / .demote (.p / .d)
║  🢒 ✅ .accettarichieste
╚══════════════════════════════════════╝`;

            const mentionJids = admins.map(a => a.id || a.jid || a).filter(Boolean);
            await sock.sendMessage(from, { text, mentions: mentionJids });
    },
};
