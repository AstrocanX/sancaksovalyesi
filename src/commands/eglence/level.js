const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLevelData } = require('../../utils/level');
const { getRequiredXP } = require('../../utils/level'); // Eğer ayrıysa, birleşikse yukarıdaki yeterli

module.exports = {
  __type__: 1,
  command: new SlashCommandBuilder()
      .setName('level')
      .setDescription('Kullanıcının seviyesini gösterir.')
      .addUserOption(opt =>
          opt.setName('kullanıcı')
              .setDescription('Seviyesini öğrenmek istediğin kişi')
              .setRequired(false)
      ),

  run: async (client, interaction) => {
    const user = interaction.options.getUser('kullanıcı') || interaction.user;
    const data = getLevelData(user.id);
    const xpNeeded = getRequiredXP(data.level);

    const embed = new EmbedBuilder()
        .setTitle(`📈 ${user.username} - Seviye Bilgisi`)
        .setDescription(`🔹 Seviye: **${data.level}**\n✨ XP: **${data.xp}/${xpNeeded}**`)
        .setColor('Blue')
        .setFooter({ text: `Kullanıcı ID: ${user.id}` })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
