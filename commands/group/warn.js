'use strict';

module.exports = {
    name: 'warn',
    aliases: [],
    description: "Esegue il comando .warn.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


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
    },
};
