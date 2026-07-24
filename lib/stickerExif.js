'use strict';

const webp = require('node-webpmux');
const { STICKER_PACK_ID, STICKER_PACK_NAME, STICKER_AUTHOR } = require('../config');

function createStickerExif() {
    const metadata = Buffer.from(JSON.stringify({
        'sticker-pack-id': STICKER_PACK_ID,
        'sticker-pack-name': STICKER_PACK_NAME,
        'sticker-pack-publisher': STICKER_AUTHOR,
        emojis: ['✨'],
    }), 'utf8');
    const header = Buffer.from([
        0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x41, 0x57, 0x07, 0x00,
    ]);
    const length = Buffer.alloc(4);
    length.writeUIntLE(metadata.length, 0, 4);
    return Buffer.concat([header, length, metadata]);
}

async function writeStickerExif(webpPath) {
    const image = new webp.Image();
    await image.load(webpPath);
    await image.save(webpPath, { exif: createStickerExif() });
}

module.exports = { createStickerExif, writeStickerExif };
