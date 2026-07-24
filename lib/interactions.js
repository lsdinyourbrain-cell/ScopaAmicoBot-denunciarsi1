'use strict';

const content = require('./content');

function createInteractionCommand({ name, emoji, phrases, aliases = [], targetFirst = false, suffix = '' }) {
    return {
        name,
        aliases,
        async execute(ctx) {
            if (!ctx.targetJid) return ctx.reply('Tagga qualcuno oppure rispondi a un suo messaggio.');
            const phrase = ctx.randomChoice(content[phrases]);
            const text = targetFirst
                ? `${emoji} @${ctx.targetJid.split('@')[0]}:\n*«${phrase}»*`
                : `${emoji} @${ctx.sender.split('@')[0]} ${phrase} @${ctx.targetJid.split('@')[0]}${suffix}`;
            await ctx.sock.sendMessage(ctx.from, { text, mentions: [ctx.sender, ctx.targetJid] }, { quoted: ctx.msg });
        },
    };
}

module.exports = { createInteractionCommand };
