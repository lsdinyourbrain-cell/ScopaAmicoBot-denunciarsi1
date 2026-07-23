'use strict';

module.exports = {
    name: 'sasso',
    aliases: ["carta","forbici"],
    description: "Esegue il comando .sasso.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            const choices = ['sasso', 'carta', 'forbici'];
            const botChoice = randomChoice(choices);
            const beats = { sasso: 'forbici', carta: 'sasso', forbici: 'carta' };
            const result = command === botChoice
                ? '🤝 Pari, ci avete pensato allo stesso modo.'
                : beats[command] === botChoice
                    ? '🥳 Hai vinto, easy.'
                    : '😅 Stavolta vince il bot.';
            await reply(`✊ *Tu:* ${command}\n🤖 *Bot:* ${botChoice}\n\n${result}`);
    },
};
