'use strict';

module.exports = {
    name: 'tris',
    aliases: [],
    description: "Esegue il comando .tris.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (/^[1-9]$/.test(textArgs)) {

            if (!isGroup) return reply("❌ Il tris si gioca solo nei gruppi.");
            const game = db[from]?.tris;
            if (!game || !game.active) return reply("❌ Nessuna partita attiva. Usa `.tris @utente` per iniziare.");
            if (!Array.isArray(game.players) || game.players.length !== 2) return reply("❌ Partita corrotta. Riparti con `.tris @utente`.");
            if (typeof game.turn !== 'number' || game.turn < 0 || game.turn > 1) return reply("❌ Stato partita non valido.");
            if (!sameJid(game.players[game.turn], sender)) return reply("⏳ Non è il tuo turno!");

            const idx = parseInt(textArgs) - 1;
            if (game.board[idx] !== '') return reply("❌ Cella già occupata!");

            const mark = game.turn % 2 === 0 ? '❌' : '⭕';
            game.board[idx] = mark;
            game.turn++;
            saveDB();

            const { winner, draw } = checkTrisWinner(game.board, game.players, game.turn);

            let resultText;
            if (winner) {
                game.active = false;
                saveDB();
                resultText = `🎮 *TRIS — PARTITA TERMINATA!*\n\n${renderTrisBoard(game.board)}\n\n🏆 @${winner.split('@')[0]} ha vinto! 🎉`;
            } else if (draw) {
                game.active = false;
                saveDB();
                resultText = `🎮 *TRIS — PARTITA TERMINATA!*\n\n${renderTrisBoard(game.board)}\n\n🤝 *Pareggio!*`;
} else {
                const nextPlayer = game.players[game.turn % 2];
                resultText = `🎮 *TRIS*\n\n${renderTrisBoard(game.board)}\n\n🔄 Turno di @${nextPlayer.split('@')[0]}\n_Scrivi .tris <1-9> o rispondi col numero_`;
            }

            await sock.sendMessage(from, {
                text: resultText,
                edit: game.gameMessageKey,
                mentions: game.players,
            });
        } else {

            if (!isGroup) return reply("❌ Il tris si gioca solo nei gruppi.");
            if (!targetJid || sameJid(targetJid, sender)) return reply("Tagga un avversario. Esempio: `.tris @utente`");
            if (db[from]?.tris?.active) return reply("❌ C'è già una partita in corso in questo gruppo!");

            if (!db[from]) db[from] = {};

            const board = ['', '', '', '', '', '', '', '', ''];
            db[from].tris = {
                board,
                players: [sender, targetJid],
                turn: 0,
                active: true,
                gameMessageKey: null,
            };
            saveDB();

            const gameMsg = await sock.sendMessage(from, {
                text: `🎮 *TRIS — NUOVA PARTITA!*\n\n${renderTrisBoard(board)}\n\n❌ @${sender.split('@')[0]} *vs* ⭕ @${targetJid.split('@')[0]}\n\n🔄 Turno di @${sender.split('@')[0]}\n_Rispondi con 1-9_`,
                mentions: [sender, targetJid],
            });

            // Salva la key completa del messaggio per edit futuro
            db[from].tris.gameMessageKey = gameMsg.key;
            saveDB();
        }
    },
};
