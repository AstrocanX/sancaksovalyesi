const { Events, EmbedBuilder } = require('discord.js');
const { enterGiveaway } = require('../features/giveaways/manager');

module.exports = {
  __type__: 5,
  event: Events.InteractionCreate,
  once: false,

  run: async (client, interaction) => {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith('join_giveaway_')) return;

    const messageId = interaction.customId.split('_').pop();
    const result = enterGiveaway(interaction.member, messageId);

    if (!result.status) {
      return interaction.reply({
        content: `❌ ${result.reason}`,
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setDescription(`🎉 Başarıyla çekilişe katıldın! Bol şans ${interaction.user}!`);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
