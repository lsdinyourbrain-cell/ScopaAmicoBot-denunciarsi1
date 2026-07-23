'use strict';

const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'database.json');
let db = {};
let saveTimer = null;

function load() {
    if (!fs.existsSync(DB_FILE)) return;
    try {
        const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        db = parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
        console.error('[DB] Errore lettura database, ripristino vuoto:', error.message);
        db = {};
    }
}

function save() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf8', error => {
            if (error) console.error('[DB] Errore salvataggio:', error.message);
        });
    }, 500);
}

function getUser(jid, chatId) {
    if (!db[chatId]) db[chatId] = {};
    if (!db[chatId][jid]) {
        db[chatId][jid] = {
            money: 100,
            warnings: 0,
            isMuted: false,
            msgCount: 0,
            spouse: null,
            children: [],
            parents: [],
            inventory: [],
        };
        save();
    }

    const user = db[chatId][jid];
    user.money = Number.isFinite(user.money) ? user.money : 100;
    user.warnings = Number.isFinite(user.warnings) ? user.warnings : 0;
    user.isMuted = Boolean(user.isMuted);
    user.msgCount = Number.isFinite(user.msgCount) ? user.msgCount : 0;
    user.spouse ??= null;
    user.children = Array.isArray(user.children) ? user.children : [];
    user.parents = Array.isArray(user.parents) ? user.parents : [];
    user.inventory = Array.isArray(user.inventory) ? user.inventory : [];
    return user;
}

const getChat = chatId => db[chatId] || {};

module.exports = { DB_FILE, load, save, getUser, getChat };
