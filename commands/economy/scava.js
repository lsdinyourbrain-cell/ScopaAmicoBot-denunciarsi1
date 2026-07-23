'use strict';

module.exports = {
    name: 'scava',
    aliases: [],
    description: "Esegue il comando .scava.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            const guadagno = Math.floor(Math.random() * 50) + 10;
            const uDB      = getUser(sender, from);
            uDB.money += guadagno;
            saveDB();
            await reply(`⛏️ Hai lavorato sodo e guadagnato *${guadagno}€*!\n💰 *Nuovo saldo:* ${uDB.money}€`);
    },
};
