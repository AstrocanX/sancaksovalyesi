const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const createGiveawayEmbed = require('./giveawayMessage');
const { getLevelData } = require('../../utils/level'); // varsa seviye fonksiyonları buraya
const dataPath = path.join(__dirname, 'data.json');

const giveaways = new Collection();

// JSON verisini oku
function readData() {
  try {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch {
    return {};
  }
}

// JSON verisini kaydet
function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// Çekiliş başlat
async function startGiveaway({
  channel,
  prize,
  duration,
  requiredRoleId = null,
  requiredLevel = null,
  notifyRoleId = null
}) {
  const endTime = Date.now() + duration;

  const requirements = [];
  if (requiredRoleId) requirements.push(`<@&${requiredRoleId}> rolüne sahip olmalısın.`);
  if (requiredLevel) requirements.push(`En az seviye ${requiredLevel} olmalısın.`);

  const message = await channel.send(
    createGiveawayEmbed({ prize, time: endTime, requirements: requirements.join('\n') || 'Şartsız katılım!' })
  );

  // Bildirim rolünü etiketle
  if (notifyRoleId) {
    await channel.send(`<@&${notifyRoleId}> 🎁 Yeni bir çekiliş başladı!`).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
  }

  // Veriyi kaydet
  const data = readData();
  data[message.id] = {
    channelId: channel.id,
    messageId: message.id,
    prize,
    endTime,
    requiredRoleId,
    requiredLevel,
    participants: []
  };
  saveData(data);

  // Otomatik bitirme zamanlayıcısı
  scheduleEnding(message.client, message.id, endTime);
}

// Katılımcı ekle
function enterGiveaway(user, messageId) {
  const data = readData();
  const giveaway = data[messageId];
  if (!giveaway) return { status: false, reason: 'Çekiliş bulunamadı.' };

  if (giveaway.participants.includes(user.id)) {
    return { status: false, reason: 'Zaten katıldın!' };
  }

  // Şart kontrolü
  const member = user.guild.members.cache.get(user.id);
  const hasRole = giveaway.requiredRoleId ? member.roles.cache.has(giveaway.requiredRoleId) : true;
  const hasLevel = giveaway.requiredLevel
    ? getLevelData(user.id)?.level >= giveaway.requiredLevel
    : true;

  if (!hasRole || !hasLevel) {
    return { status: false, reason: 'Katılım şartlarını karşılamıyorsun.' };
  }

  giveaway.participants.push(user.id);
  saveData(data);

  return { status: true };
}

// Bitirme
async function endGiveaway(client, messageId) {
  const data = readData();
  const giveaway = data[messageId];
  if (!giveaway) return;

  const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
  if (!channel) return;

  const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
  if (!message) return;

  const winnerId = giveaway.participants[Math.floor(Math.random() * giveaway.participants.length)];
  const winnerText = winnerId ? `<@${winnerId}> 🎉 Kazandın!` : 'Kimse katılmadı 😢';

  await message.edit({
    embeds: [
      message.embeds[0].setTitle('🎉 Çekiliş Bitti!').setDescription(`**Ödül:** ${giveaway.prize}\n${winnerText}`)
    ],
    components: []
  });

  delete data[messageId];
  saveData(data);

  // 6 saat sonra sil
  setTimeout(() => {
    message.delete().catch(() => {});
  }, 6 * 60 * 60 * 1000);
}

// Otomatik sonlandırma planla
function scheduleEnding(client, messageId, endTime) {
  const timeLeft = endTime - Date.now();
  if (timeLeft <= 0) return endGiveaway(client, messageId);

  setTimeout(() => endGiveaway(client, messageId), timeLeft);
}

module.exports = {
  startGiveaway,
  enterGiveaway,
  endGiveaway,
  scheduleEnding
};
