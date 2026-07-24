'use strict';

const activeBounties = {};

const BONUS_MIN = 100;
const BONUS_MAX = 500;
const SPAWN_CHANCE = 0.05;

const trySpawnBounty = (chatId, members) => {
    if (Math.random() > SPAWN_CHANCE) return null;
    if (activeBounties[chatId]) return null;
    const target = members[Math.floor(Math.random() * members.length)];
    const reward = Math.floor(Math.random() * (BONUS_MAX - BONUS_MIN + 1)) + BONUS_MIN;
    activeBounties[chatId] = { target: target.jid || target.id || target, reward, timestamp: Date.now() };
    return activeBounties[chatId];
};

const claimBounty = (chatId, userId) => {
    const bounty = activeBounties[chatId];
    if (!bounty) return null;
    if (bounty.target === userId) return null;
    const success = Math.random() < 0.6;
    if (success) {
        delete activeBounties[chatId];
        return bounty.reward;
    }
    return 0;
};

const getBounty = (chatId) => activeBounties[chatId] || null;

const removeBounty = (chatId) => { delete activeBounties[chatId]; };

module.exports = { trySpawnBounty, claimBounty, getBounty, removeBounty };
