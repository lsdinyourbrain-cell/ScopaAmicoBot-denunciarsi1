'use strict';

const fs = require('fs');
const path = require('path');

let triggerWords = [];
let reactions = [];
let loaded = false;

const loadFiles = (dataDir) => {
    const wordsFile = path.join(dataDir, 'bestemmie_trigger.txt');
    const reactsFile = path.join(dataDir, 'bestemmiometro.txt');
    try {
        if (fs.existsSync(wordsFile)) {
            triggerWords = fs.readFileSync(wordsFile, 'utf-8').split('\n').map(s => s.trim().toLowerCase()).filter(Boolean);
        }
        if (fs.existsSync(reactsFile)) {
            reactions = fs.readFileSync(reactsFile, 'utf-8').split('\n').map(s => s.trim()).filter(Boolean);
        }
        loaded = true;
    } catch (e) {
        console.error('[BESTEMMIOMETRO] Errore caricamento file:', e.message);
    }
};

const checkText = (text) => {
    if (!loaded || !triggerWords.length) return false;
    const lower = text.toLowerCase();
    return triggerWords.some(w => lower.includes(w));
};

const getReaction = () => {
    if (!reactions.length) return '🤬 Ma che stai a di\'?';
    return reactions[Math.floor(Math.random() * reactions.length)];
};

module.exports = { loadFiles, checkText, getReaction };
