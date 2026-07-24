'use strict';

const cooldowns = {};

const getCooldown = (userId, key) => {
    const id = `${userId}:${key}`;
    const entry = cooldowns[id];
    if (!entry) return 0;
    const remaining = entry - Date.now();
    if (remaining <= 0) {
        delete cooldowns[id];
        return 0;
    }
    return remaining;
};

const setCooldown = (userId, key, ms) => {
    cooldowns[`${userId}:${key}`] = Date.now() + ms;
};

const checkCooldown = (userId, key, ms) => {
    const remaining = getCooldown(userId, key);
    if (remaining > 0) return remaining;
    setCooldown(userId, key, ms);
    return 0;
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = { getCooldown, setCooldown, checkCooldown, sleep };
