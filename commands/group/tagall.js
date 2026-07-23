'use strict';

module.exports = {
    name: 'tagall',
    aliases: [],
    description: "Esegue il comando .tagall.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!isGroup) {
                return reply(
`╭──────────────────────────────────────╮
│  📢  *TAGALL*
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
│  possono usare *.tagall*. 👑
╰──────────────────────────────────────╯`
                );
            }
            try {
                const meta         = await sock.groupMetadata(from);
                const participants = Array.isArray(meta.participants) ? meta.participants : [];
                const allJids      = participants.map(p => p.id || p.jid).filter(Boolean);
                const mentions     = allJids;
                // Scrive esplicitamente tutti i @handle nel testo
                const handles      = allJids.map(id => `@${id.split('@')[0]}`).join('  ');
                const header       = textArgs.trim() || '👀 Attenzione a tutti!';

                await sock.sendMessage(from, {
                    text    : `╭──────────────────────────────────────╮\n│  📢  *ANNUNCIO DI GRUPPO*\n├──────────────────────────────────────┤\n│  ${header}\n╰──────────────────────────────────────╯\n\n${handles}`,
                    mentions,
                }, { quoted: msg });

            } catch (e) {
                console.error('[tagall]', e.message);
                await reply("❌ Non riesco a leggere i partecipanti del gruppo.");
            }
    },
};
