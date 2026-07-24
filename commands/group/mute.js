'use strict';

module.exports = {
    name: 'mute',
    aliases: ["unmute"],
    description: "Silenzia un utente con tempo opzionale.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!isGroup) return reply("Funziona solo nei gruppi.");
            if (!isSenderAdmin) return reply("Solo gli admin possono mutare.");
            if (!isBotAdmin) return reply("Rendimi admin prima.");
            if (!targetJid) return reply("Tagga la persona da mutare.");

            const targetData = getUser(targetJid, from);

            if (command === 'unmute') {
                targetData.isMuted = false;
                saveDB();
                return await sock.sendMessage(from, { text: `🔊 @${targetJid.split('@')[0]} può scrivere di nuovo.`, mentions: [targetJid] });
            }

            let duration = 0;
            if (textArgs) {
                const match = textArgs.match(/(\d+)\s*(s|sec|m|min|h|ora)?/i);
                if (match) {
                    const num = parseInt(match[1]);
                    const unit = (match[2] || 'm').toLowerCase();
                    if (unit === 's' || unit === 'sec') duration = num * 1000;
                    else if (unit === 'm' || unit === 'min') duration = num * 60000;
                    else if (unit === 'h' || unit === 'ora') duration = num * 3600000;
                    else duration = num * 60000;
                }
            }

            targetData.isMuted = true;
            saveDB();

            const durationText = duration > 0
                ? ` per ${Math.ceil(duration / 60000)} minuti`
                : '';
            await sock.sendMessage(from, {
                text: `🔇 @${targetJid.split('@')[0]} è stato mutato${durationText}.`,
                mentions: [targetJid],
            });

            if (duration > 0) {
                setTimeout(() => {
                    const fresh = getUser(targetJid, from);
                    fresh.isMuted = false;
                    saveDB();
                }, duration);
            }
    },
};
