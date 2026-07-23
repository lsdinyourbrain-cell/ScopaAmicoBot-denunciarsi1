'use strict';

module.exports = {
    name: 'spegni',
    aliases: [],
    description: "Esegue il comando .spegni.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!isOwner) return reply("╭────〔 ⛔ ACCESSO NEGATO 〕────╮\n│ Comando riservato all'Owner del bot.\n╰──────────────────────────────╯");
            
            setBotActive(false);
            await reply("╭────〔 ⚙️ SISTEMA 〕────╮\n│ 🛑 Bot in modalità SOSPENSIONE.\n│ Non risponderò a nessuno,\n│  tranne che all'Owner.\n╰──────────────────────╯");
    },
};
