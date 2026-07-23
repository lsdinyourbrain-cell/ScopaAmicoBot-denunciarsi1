'use strict';

module.exports = {
    name: 'lyrics',
    aliases: [],
    description: "Esegue il comando .lyrics.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!textArgs) return reply("Scrivi titolo e artista. Esempio: .lyrics Blinding Lights The Weeknd");
            try {
                const search = await axios.get('https://itunes.apple.com/search', {
                    params: { term: textArgs, entity: 'song', limit: 1 },
                    timeout: 10_000,
                });
                const song = search.data?.results?.[0];
                if (!song) return reply("Non ho trovato quella canzone.");
                const lyricsResponse = await axios.get(
                    `https://api.lyrics.ovh/v1/${encodeURIComponent(song.artistName)}/${encodeURIComponent(song.trackName)}`,
                    { timeout: 10_000 }
                );
                const lyrics = lyricsResponse.data?.lyrics?.trim();
                if (!lyrics) return reply(`Ho trovato *${song.trackName}*, ma il testo non è disponibile.`);
                await reply(`🎤 *${song.trackName}* — _${song.artistName}_\n\n${lyrics.slice(0, 6000)}${lyrics.length > 6000 ? '\n\n…testo tagliato qui.' : ''}`);
            } catch (_) {
                await reply("Non riesco a recuperare il testo in questo momento. Riprova più tardi.");
            }
    },
};
