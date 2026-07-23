'use strict';

const fs = require('fs');
const path = require('path');

const walk = (directory) => {
    if (!fs.existsSync(directory)) return [];

    return fs.readdirSync(directory, { withFileTypes: true })
        .flatMap(entry => {
            const fullPath = path.join(directory, entry.name);
            if (entry.isDirectory()) return walk(fullPath);
            return entry.isFile() && entry.name.endsWith('.js') ? [fullPath] : [];
        });
};

const normalizeName = (name, file) => {
    if (typeof name !== 'string' || !name.trim()) {
        throw new TypeError(`Il comando in ${file} non ha un nome valido.`);
    }

    return name.trim().toLowerCase();
};

function loadCommands(commandsDirectory) {
    const commands = new Map();
    const files = walk(path.resolve(commandsDirectory));

    for (const file of files) {
        delete require.cache[require.resolve(file)];
        const command = require(file);
        if (!command || typeof command.run !== 'function') {
            throw new TypeError(`Il modulo ${file} deve esportare { name, aliases?, description, run }.\n`);
        }

        if (typeof command.description !== 'string' || !command.description.trim()) {
            throw new TypeError(`Il comando in ${file} deve avere una description non vuota.`);
        }

        const aliases = command.aliases ?? [];
        if (!Array.isArray(aliases)) {
            throw new TypeError(`Gli alias di ${file} devono essere un array.`);
        }

        for (const name of [command.name, ...aliases]) {
            const key = normalizeName(name, file);
            if (commands.has(key)) {
                throw new Error(`Comando o alias duplicato: "${key}" (${file})`);
            }
            commands.set(key, command);
        }
    }

    return { commands, files };
}

module.exports = { loadCommands };
