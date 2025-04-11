const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { startGiveaway } = require('../../features/giveaways/manager');

module.exports = {
  __type__: 1,
  command: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('🎉 Yeni bir çekiliş başlat')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
    .addChannelOption(opt =>
      opt.setName('kanal')
        .setDescription('Çekilişin gönderileceği kanal')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true))
    .addIntegerOption(opt =>
      opt.setName('kazanan')
        .setDescription('Kazanan sayısı')
        .setMinValue(1)
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('süre')
        .setDescription('Ne kadar sürecek? Örn: 1h, 30m, 2d')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('ödül')
        .setDescription('Kazananın alacağı ödül')
        .setRequired(true))
    .addRoleOption(opt =>
      opt.setName('rol')
        .setDescription('Katılım için gerekli rol (isteğe bağlı)'))
    .addIntegerOption(opt =>
      opt.setName('seviye')
        .setDescription('Katılım için minimum seviye (isteğe bağlı)')),

  run: async (client, interaction) => {
    const channel = interaction.options.getChannel('kanal');
    const winnerCount = interaction.options.getInteger('kazanan');
    const duration = interaction.options.getString('süre');
    const prize = interaction.options.getString('ödül');
    const requiredRole = interaction.options.getRole('rol');
    const requiredLevel = interaction.options.getInteger('seviye');

    const result = await startGiveaway({
      client,
      channel,
      winnerCount,
      duration,
      prize,
      startedBy: interaction.user,
      requiredRoleId: requiredRole?.id || null,
      requiredLevel: requiredLevel || null
    });

    if (!result.success) {
      return interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
    }

    return interaction.reply({ content: '🎉 Çekiliş başlatıldı!', ephemeral: true });
  }
};
