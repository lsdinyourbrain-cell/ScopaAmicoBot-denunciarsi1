'use strict';

module.exports = {
    name: 'dadi',
    aliases: [],
    description: "Esegue il comando .dadi.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            const puntata = parseInt(args[0]);
            if (isNaN(puntata) || puntata <= 0) return reply("⚠️ Specifica una puntata valida.\n👉 *Uso:* `.dadi 50`");

            const uDB = getUser(sender, from);
            if (uDB.money < puntata) return reply("❌ Saldo insufficiente.");

            const userRoll = Math.floor(Math.random() * 6) + 1;
            const botRoll  = Math.floor(Math.random() * 6) + 1;

            let esito;
            if (userRoll > botRoll) {
                uDB.money += puntata;
                esito = `✅ *HAI VINTO!* (+${puntata}€)`;
            } else if (userRoll < botRoll) {
                uDB.money -= puntata;
                esito = `❌ *HAI PERSO!* (-${puntata}€)`;
            } else {
                esito = `🤝 *PAREGGIO!* (0€)`;
            }

            saveDB();
            await reply(
`╭────〔 🎲 *LANCIO DADI* 〕────╮
│ 🧑 Tu: *${userRoll}*
│ 🤖 Bot: *${botRoll}*
├──────────────────────────────
│ ${esito}
│ 💰 *Saldo attuale:* ${uDB.money}€
╰──────────────────────────────╯`
            );
    },
};
