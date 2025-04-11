const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

module.exports = function createGiveawayEmbed({ prize, time, requirements }) {
  const embed = new EmbedBuilder()
    .setTitle('🎉 Yeni Çekiliş Başladı!')
    .setDescription(`**Ödül:** ${prize}\n**Bitiş:** <t:${Math.floor(time / 1000)}:R>\n\n${requirements}`)
    .setColor('Blurple')
    .setTimestamp(time);

  const button = new ButtonBuilder()
    .setCustomId('enter_giveaway')
    .setLabel('Katıl 🎁')
    .setStyle(ButtonStyle.Success);

  return {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(button)]
  };
};
