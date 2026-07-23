'use strict';

module.exports = {
    name: 'ship',
    aliases: [],
    description: 'Calcola la compatibilità fra chi invia il comando e la persona taggata.',

    async run(sock, msg, args, context) {
        const { from, sender, targetJid, reply, services } = context;
        const { randomInt } = services;
        if (!targetJid) return reply('Tagga qualcuno oppure rispondi a un suo messaggio.');

        const percent = randomInt(1, 100);
        const mood = percent >= 85 ? 'match pazzesco 💘'
            : percent >= 60 ? 'qui c’è del potenziale ✨'
            : percent >= 35 ? 'ci vuole un po’ di impegno 😬'
            : 'meglio restare amici, forse 🫶';

        await sock.sendMessage(from, {
            text: `💞 @${sender.split('@')[0]} + @${targetJid.split('@')[0]}\n\nCompatibilità: *${percent}%* — ${mood}`,
            mentions: [sender, targetJid],
        }, { quoted: msg });
    },
};
