'use strict';

const fs = require('fs');
const path = require('path');

const WELCOME_FILE = path.join(__dirname, 'welcome.json');
const DB_FILE = path.join(__dirname, 'database.json');

let welcomeDb = {};
if (fs.existsSync(WELCOME_FILE)) {
    try {
        welcomeDb = JSON.parse(fs.readFileSync(WELCOME_FILE, 'utf-8'));
    } catch (e) {
        console.error('Errore lettura welcome.json:', e.message);
    }
}

let db = {};
if (fs.existsSync(DB_FILE)) {
    try {
        db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (e) {
        console.error('Errore lettura database.json:', e.message);
    }
}

function saveWelcome() {
    fs.writeFileSync(WELCOME_FILE, JSON.stringify(welcomeDb, null, 2), 'utf-8');
}

function saveDB() {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function printHelp() {
    console.log(`
=== WELCOME/GOODBYE & MUTE CLI ===

Comandi welcome/goodbye:
  welcome <groupJid> <on|off|status>  - Gestisci benvenuto per un gruppo
  goodbye <groupJid> <on|off|status>  - Gestisci arrivederci per un gruppo

Comandi mute:
  mute <groupJid> <userJid>           - Muta un utente nel gruppo
  unmute <groupJid> <userJid>         - Smuta un utente nel gruppo
  mutelist <groupJid>                 - Lista utenti mutati nel gruppo

Esempi:
  node mute-cli.js welcome 123456789@g.us on
  node mute-cli.js goodbye 123456789@g.us off
  node mute-cli.js welcome 123456789@g.us status
  node mute-cli.js mute 123456789@g.us 987654321@s.whatsapp.net
  node mute-cli.js unmute 123456789@g.us 987654321@s.whatsapp.net
  node mute-cli.js mutelist 123456789@g.us
`);
}

const args = process.argv.slice(2);
const cmd = args[0];

if (!cmd || cmd === 'help') {
    printHelp();
    process.exit(0);
}

if (cmd === 'welcome' || cmd === 'goodbye') {
    const groupJid = args[1];
    const action = args[2]?.toLowerCase();
    
    if (!groupJid || !action) {
        console.error('Uso:', cmd, '<groupJid> <on|off|status>');
        process.exit(1);
    }
    
    if (!welcomeDb[groupJid]) {
        welcomeDb[groupJid] = { welcome: true, goodbye: true };
    }
    
    const key = cmd === 'welcome' ? 'welcome' : 'goodbye';
    
    if (action === 'status') {
        const status = welcomeDb[groupJid][key] ? '🟢 ATTIVO' : '🔴 DISATTIVO';
        console.log(`${cmd} per ${groupJid}: ${status}`);
        process.exit(0);
    }
    
    if (action === 'on' || action === 'true' || action === 'si' || action === 'attivo') {
        welcomeDb[groupJid][key] = true;
        saveWelcome();
        console.log(`✅ ${cmd} attivato per ${groupJid}`);
        process.exit(0);
    }
    
    if (action === 'off' || action === 'false' || action === 'no' || action === 'disattivo') {
        welcomeDb[groupJid][key] = false;
        saveWelcome();
        console.log(`✅ ${cmd} disattivato per ${groupJid}`);
        process.exit(0);
    }
    
    console.error('Azione non valida: usa on, off, o status');
    process.exit(1);
}

if (cmd === 'mute' || cmd === 'unmute') {
    const groupJid = args[1];
    const userJid = args[2];
    if (!groupJid || !userJid) {
        console.error('Uso:', cmd, '<groupJid> <userJid>');
        process.exit(1);
    }
    if (!db[groupJid]) db[groupJid] = {};
    if (!db[groupJid][userJid]) {
        db[groupJid][userJid] = { money: 100, warnings: 0, isMuted: false, msgCount: 0, spouse: null, children: [], parents: [], inventory: [] };
    }
    db[groupJid][userJid].isMuted = cmd === 'mute';
    saveDB();
    console.log(`✅ Utente ${userJid} ${cmd === 'mute' ? 'mutato' : 'smutato'} in ${groupJid}`);
    process.exit(0);
}

if (cmd === 'mutelist') {
    const groupJid = args[1];
    if (!groupJid) {
        console.error('Uso: mutelist <groupJid>');
        process.exit(1);
    }
    const group = db[groupJid];
    if (!group) {
        console.log('Gruppo non trovato nel database');
        process.exit(0);
    }
    console.log(`\nUtenti mutati in ${groupJid}:`);
    let found = false;
    for (const [jid, data] of Object.entries(group)) {
        if (data.isMuted) {
            console.log(`  - ${jid} (${data.msgCount || 0} msg)`);
            found = true;
        }
    }
    if (!found) console.log('  (nessuno)');
    process.exit(0);
}

console.error('Comando sconosciuto:', cmd);
printHelp();
process.exit(1);