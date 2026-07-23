'use strict';

module.exports = {
    name: 'ai',
    aliases: [],
    description: "Esegue il comando .ai.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!textArgs) return reply("Fammi una domanda! Esempio: `.ai Qual è la capitale della Francia?`");
            if (AI_API_KEY === 'INSERISCI_QUI_LA_TUA_API_KEY') return reply("❌ API Key non configurata. Modifica la costante *AI_API_KEY* nel file.");
            try {
                const response = await axios.post(AI_API_URL, {
                    model: AI_MODEL,
                    messages: [
                        { role: 'system', content: 'Sei un assistente utile, simpatico e amichevole. Rispondi in italiano in modo conciso ma completo.' },
                        { role: 'user', content: textArgs }
                    ],
                    max_tokens: 1024,
                }, {
                    headers: {
                        'Authorization': `Bearer ${AI_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000,
                });
                const replyText = response.data?.choices?.[0]?.message?.content?.trim();
                if (!replyText) return reply("❌ L'IA non ha prodotto una risposta valida.");
                await reply(`🤖 *AI Response*\n\n${replyText}`);
            } catch (e) {
                console.error('[ai]', e.message);
                await reply("❌ Errore nella comunicazione con l'IA. Controlla la tua API Key o riprova più tardi.");
            }
    },
};
