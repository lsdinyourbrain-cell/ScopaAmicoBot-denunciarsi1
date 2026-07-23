'use strict';

const { BOT_IDENTITY, SYSTEM_FOOTER } = require('../config');

function extractBody(msg) {
    const message = msg.message;
    if (!message) return '';
    return message.conversation
        || message.extendedTextMessage?.text
        || message.imageMessage?.caption
        || message.videoMessage?.caption
        || message.buttonsResponseMessage?.selectedButtonId
        || message.listResponseMessage?.singleSelectReply?.selectedRowId
        || '';
}

const getContextInfo = (message = {}) => message.extendedTextMessage?.contextInfo
    || message.imageMessage?.contextInfo
    || message.videoMessage?.contextInfo
    || {};

const getQuotedKey = (chatId, contextInfo) => ({
    remoteJid: chatId,
    fromMe: false,
    id: contextInfo.stanzaId,
    participant: contextInfo.participant,
});

function withFooter(text) {
    return text.includes(BOT_IDENTITY) ? text : `${text}\n\n${SYSTEM_FOOTER}`;
}

function createSystemSender(sock, from, msg) {
    return async (content, options = {}) => {
        const payload = typeof content === 'string' ? { text: content } : { ...content };
        if (payload.text) payload.text = withFooter(payload.text);
        if (payload.caption) payload.caption = withFooter(payload.caption);
        return sock.sendMessage(from, payload, { quoted: msg, ...options });
    };
}

function createReply(sock, from, msg) {
    const sendSystem = createSystemSender(sock, from, msg);
    return async (text, { footer = true } = {}) => {
        try {
            return footer
                ? await sendSystem(text)
                : await sock.sendMessage(from, { text }, { quoted: msg });
        } catch (error) {
            console.error(`[reply] Errore invio: ${error.message}`);
            return null;
        }
    };
}

module.exports = { extractBody, getContextInfo, getQuotedKey, withFooter, createSystemSender, createReply };
