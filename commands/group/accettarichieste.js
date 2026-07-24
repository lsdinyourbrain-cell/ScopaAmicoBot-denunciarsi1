'use strict';

module.exports = {
    name: 'accettarichieste',
    aliases: ['approva', 'accetta'],
    description: "Accetta tutte le richieste di adesione al gruppo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!isGroup) return reply("Funziona solo nei gruppi.");
            if (!isSenderAdmin) return reply("Solo gli admin possono usare questo comando.");
            if (!isBotAdmin) return reply("Rendimi admin prima.");

            try {
                const requests = await sock.groupRequestParticipantsList(from);
                if (!requests || requests.length === 0) return reply("Nessuna richiesta in sospeso.");

                let accettate = 0;
                for (const req of requests) {
                    try {
                        await sock.groupAcceptJoinRequest(from, req.jid);
                        accettate++;
                    } catch (_) {}
                }

                await reply(`✅ *Richiesta accolte!*\n\nHai accettato *${accettate}* su *${requests.length}* richieste di adesione.`);
            } catch (e) {
                console.error('[accettarichieste]', e.message);
                await reply("❌ Errore nel recupero delle richieste. Il bot è admin?");
            }
    },
};
