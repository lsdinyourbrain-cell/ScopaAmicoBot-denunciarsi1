'use strict';

module.exports = {
    name: 'famiglia',
    aliases: [],
    description: "Esegue il comando .famiglia.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, pushName, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            const subCmd = args[0]?.toLowerCase();
            const target = mentioned[0];
            const uDB    = getUser(sender, from);

            if (!subCmd) {
                let albero = 
`╭────〔 🌳 *ALBERO GENEALOGICO* 〕────╮
│ 👤 *Utente:* ${pushName}
│ 💍 *Partner:* ${uDB.spouse ? `@${uDB.spouse.split('@')[0]}` : '_Nessuno_'}
│ 👴 *Genitori:* ${uDB.parents.length > 0 ? uDB.parents.map(p => `@${p.split('@')[0]}`).join(', ') : '_Nessuno_'}
│ 🍼 *Figli:* ${uDB.children.length > 0 ? uDB.children.map(c => `@${c.split('@')[0]}`).join(', ') : '_Nessuno_'}
╰─────────────────────────────────────╯`;

                const mentions = [...(uDB.spouse ? [uDB.spouse] : []), ...uDB.parents, ...uDB.children];
                await sock.sendMessage(from, { text: albero, mentions });
            }
            else if (subCmd === 'sposa' && target) {
                if (sameJid(target, sender)) return reply("❌ Non puoi sposarti da solo.");
                const tDB = getUser(target, from);
                if (uDB.spouse) return reply("❌ Sei già sposato/a in questo gruppo.");
                if (tDB.spouse) return reply("❌ Questo utente è già sposato/a.");

                uDB.spouse = target;
                tDB.spouse = sender;
                saveDB();
                await sock.sendMessage(from, {
                    text: `💒 *MATRIMONIO* 🎉\n@${sender.split('@')[0]} e @${target.split('@')[0]} si sono appena sposati!`,
                    mentions: [sender, target],
                });
            }
            else if (subCmd === 'divorzia') {
                if (!uDB.spouse) return reply("❌ Non sei sposato/a.");
                const ex = uDB.spouse;
                const exDB = getUser(ex, from);
                uDB.spouse = null;
                exDB.spouse = null;
                saveDB();
                await sock.sendMessage(from, {
                    text: `💔 *DIVORZIO*\n@${sender.split('@')[0]} ha divorziato ufficialmente da @${ex.split('@')[0]}.`,
                    mentions: [sender, ex],
                });
            }
            else if (subCmd === 'adotta') {
                if (!target) return reply("Tagga la persona che vuoi adottare.");
                if (sameJid(target, sender)) return reply("Non puoi adottare te stesso/a, dai.");
                if (uDB.children.includes(target)) return reply("Questa persona fa già parte della tua famiglia.");

                const tDB = getUser(target, from);
                uDB.children.push(target);
                if (!tDB.parents.includes(sender)) tDB.parents.push(sender);
                saveDB();
                await sock.sendMessage(from, {
                    text: `🍼 @${sender.split('@')[0]} ha adottato @${target.split('@')[0]}. Famiglia aggiornata!`,
                    mentions: [sender, target],
                });
            }
            else if (subCmd === 'caccia') {
                if (!target) return reply("Tagga la persona da rimuovere dalla famiglia.");
                if (!uDB.children.includes(target)) return reply("Questa persona non è tra i tuoi figli nel bot.");

                const tDB = getUser(target, from);
                uDB.children = uDB.children.filter(child => child !== target);
                tDB.parents = tDB.parents.filter(parent => parent !== sender);
                saveDB();
                await sock.sendMessage(from, {
                    text: `🚪 @${target.split('@')[0]} non è più nella famiglia di @${sender.split('@')[0]}.`,
                    mentions: [sender, target],
                });
            }
            else if (subCmd === 'abbandona') {
                if (uDB.parents.length === 0) return reply("Non hai genitori registrati nel bot.");
                const parents = [...uDB.parents];
                for (const parent of parents) {
                    const parentDB = getUser(parent, from);
                    parentDB.children = parentDB.children.filter(child => child !== sender);
                }
                uDB.parents = [];
                saveDB();
                await sock.sendMessage(from, {
                    text: `🚶 @${sender.split('@')[0]} ha scelto di andare per la sua strada.`,
                    mentions: [sender],
                });
            }
            else {
                await reply("Uso: .famiglia, .famiglia sposa @utente, .famiglia adotta @utente, .famiglia divorzia, .famiglia caccia @utente oppure .famiglia abbandona");
            }
    },
};
