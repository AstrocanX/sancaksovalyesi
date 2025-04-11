const { EmbedBuilder } = require('discord.js');
const checkMessageForBadWords = require('../utils/FilterChecker');
const levelSystem = require('../utils/level');
const { ROLES_BY_LEVEL } = levelSystem;

module.exports = {
  __type__: 5,
  event: 'messageCreate',

  run: async (client, message) => {
    if (message.author.bot || !message.guild || !message.member) return;

    // ❗ Küfür filtresi
    const result = checkMessageForBadWords(message.content);
    if (result.matched) {
      try {
        await message.member.timeout(result.muteTime * 1000, `Used filtered word (${result.category})`);
        if (message.deletable) await message.delete().catch(() => {});

        try {
          await message.author.send(
              `🚫 Sunucuda yasaklı bir kelime kullandığın için mute cezası aldın.\n**Kategori:** ${result.category}\n**Süre:** ${result.muteTime / 60} dakika`
          );
        } catch {
          console.warn(`[UYARI] ${message.author.tag} kullanıcısına DM gönderilemedi.`);
        }

        const logChannel = message.guild.channels.cache.find(c => c.name === 'mute-log' && c.isTextBased());
        if (logChannel) {
          const embed = new EmbedBuilder()
              .setTitle('🚨 Küfür Tespit Edildi')
              .setDescription(`**${message.author.tag}** küfür ettiği için **mute** cezası aldı.`)
              .addFields(
                  { name: 'Mesaj', value: message.content || 'Alınamadı' },
                  { name: 'Kategori', value: result.category, inline: true },
                  { name: 'Süre', value: `${result.muteTime / 60} dakika`, inline: true },
                  { name: 'Kanal', value: `<#${message.channel.id}>`, inline: true }
              )
              .setColor('Red')
              .setTimestamp()
              .setFooter({ text: `Kullanıcı ID: ${message.author.id}` });

          await logChannel.send({ embeds: [embed] });
        }
      } catch (err) {
        console.error('Küfür sistemi hatası:', err);
      }
      return;
    }

    // ⛔ Spam koruması
    if (!client._lastXPMap) client._lastXPMap = new Map();
    const lastXPTime = client._lastXPMap.get(message.author.id);
    const now = Date.now();
    const cooldown = 15000; // 15 saniye
    if (lastXPTime && now - lastXPTime < cooldown) return;
    client._lastXPMap.set(message.author.id, now);

    // ✅ Level sistemi
    const xpToAdd = Math.floor(Math.random() * 6) + 5;
    const resultXP = levelSystem.addXP(message.author.id, xpToAdd);

    if (resultXP.leveledUp && resultXP.level % 10 === 0) {
      const embed = new EmbedBuilder()
          .setTitle('🎉 Seviye Atladın!')
          .setDescription(`Tebrikler ${message.author}, seviye ${resultXP.level} oldun!`)
          .setColor('Green')
          .setTimestamp();

      message.channel.send({ content: `${message.author}`, embeds: [embed] });

      // 🧹 Önce eski rütbeleri sil
      const allRankRoleIds = Object.values(ROLES_BY_LEVEL);
      for (const roleId of allRankRoleIds) {
        if (message.member.roles.cache.has(roleId) && !resultXP.newRoles.includes(roleId)) {
          await message.member.roles.remove(roleId).catch(() => {});
        }
      }

      // ✅ Yeni rol(ler)i ver
      for (const roleId of resultXP.newRoles) {
        const role = message.guild.roles.cache.get(roleId);
        if (role) await message.member.roles.add(role).catch(() => {});
      }
    }
  }
};
