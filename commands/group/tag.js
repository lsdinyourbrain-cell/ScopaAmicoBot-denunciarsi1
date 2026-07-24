'use strict';

module.exports = {
    name: 'tag',
    aliases: [],
    description: "Esegue il comando .tag.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!isGroup) {
                return reply(
`╭──────────────────────────────────────╮
│  🏷️  *TAG / HIDETAG*
├──────────────────────────────────────┤
│  Funziona solo nei *gruppi*. 👥
╰──────────────────────────────────────╯`
                );
            }
            if (!isSenderAdmin) {
                return reply(
`╭──────────────────────────────────────╮
│  ⛔  *ACCESSO NEGATO*
├──────────────────────────────────────┤
│  Solo gli *admin del gruppo*
│  possono usare *.tag*. 👑
╰──────────────────────────────────────╯`
                );
            }

try {
                console.log('[tag] from:', from, 'isGroup:', isGroup);
                const meta         = await sock.groupMetadata(from);
                console.log('[tag] meta:', meta ? 'ok' : 'null');
                const participants = Array.isArray(meta.participants) ? meta.participants : [];
                console.log('[tag] participants count:', participants.length);

                // Raccoglie tutti i JID del gruppo (sender incluso, bot escluso)
                const botJid  = sock.user?.id || null;
                const mentions = participants
                    .map(p => p.id || p.jid)
                    .filter(jid => jid && (!botJid || !sameJid(jid, botJid)));

                // Testo del messaggio: personalizzato se passato, generico altrimenti.
                // NON include le @ nel corpo — le notifiche arrivano solo via `mentions`.
                const customText = textArgs.trim();
                const tagBody    = customText ||
`📢 *Attenzione a tutti!*
${meta.subject ? `\n_Messaggio nel gruppo: ${meta.subject}_` : ''}`;

                await sock.sendMessage(from,
                    {
                        text    : tagBody,
                        mentions,          // ← qui la magia: notifiche senza @ nel testo
                    },
                    { quoted: msg }
                );

            } catch (e) {
                console.error('[tag] error:', e);
                await reply(`❌ Errore tag: ${e.message} | from=${from}`);
            }
    },
};
