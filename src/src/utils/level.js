const fs = require('fs');
const path = require('path');
const LEVELS_PATH = path.join(__dirname, '../data/levels.json');

const ROLES_BY_LEVEL = {
  10: '1360138278950539413',
  20: '1360138669704609813',
  30: '1360138887816679643',
  40: '1360139148312449155',
  50: '1360139332375285861',
  60: '1360139892729974907',
  70: '1360140375582572554',
  80: '1360140118152708279',
  90: '1360140552070369460',
  100: '1360141964724666428'
};

function getLevelData(userId) {
  try {
    const data = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8'));
    return data[userId] || { xp: 0, level: 1 };
  } catch {
    return { xp: 0, level: 1 };
  }
}

function saveLevelData(userId, data) {
  let allData = {};
  try {
    allData = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8'));
  } catch {}
  allData[userId] = data;
  fs.writeFileSync(LEVELS_PATH, JSON.stringify(allData, null, 2));
}

function getRequiredXP(level) {
  return 100 + (level - 1) * 100;
}

function addXP(userId, amount) {
  const data = getLevelData(userId);
  data.xp += amount;

  let leveledUp = false;
  const newRoles = [];

  while (data.xp >= getRequiredXP(data.level)) {
    data.xp -= getRequiredXP(data.level);
    data.level++;
    leveledUp = true;
    if (ROLES_BY_LEVEL[data.level]) {
      newRoles.push(ROLES_BY_LEVEL[data.level]);
    }
  }

  saveLevelData(userId, data);
  return { ...data, leveledUp, newRoles };
}

module.exports = {
  getLevelData,
  addXP,
  getRequiredXP, // ← Bunu da ekle
  ROLES_BY_LEVEL
};
