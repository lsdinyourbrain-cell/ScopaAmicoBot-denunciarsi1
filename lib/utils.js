'use strict';

const { execFile } = require('child_process');
const { promisify } = require('util');

const randomChoice = values => values[Math.floor(Math.random() * values.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const formatMoney = value => `${Math.max(0, Math.floor(Number(value) || 0))}€`;

module.exports = { randomChoice, randomInt, formatMoney, execFileAsync: promisify(execFile) };
