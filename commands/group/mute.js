'use strict';

module.exports = {
    name: 'mute',
    aliases: ["unmute"],
    description: "Esegue il comando .mute.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


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
    },
};
