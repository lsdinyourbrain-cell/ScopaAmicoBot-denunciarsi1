'use strict';

module.exports = {
    name: 'simpatometro',
    aliases: [],
    description: 'Misura in modo goliardico la simpatia della persona indicata.',

    async run(sock, msg, args, context) {
        const { from, sender, targetJid, services } = context;
        const { randomInt } = services;
        const person = targetJid || sender;
        const percent = randomInt(1, 100);
        const note = percent >= 80 ? 'spacca davvero' : percent >= 50 ? 'promosso/a' : 'può fare di meglio';
        await sock.sendMessage(from, {
            text: `😄 @${person.split('@')[0]} ha un livello di simpatia del *${percent}%* — ${note}.`,
            mentions: [person],
        });
    },
};
