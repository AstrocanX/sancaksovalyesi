// src/commands/giveaway/notify.js

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const SETTINGS_PATH = path.join(__dirname, '../../data/settings.json');
const NOTIFY_ROLE_NAME = 'cekilis-bildirim';

module.exports = {
  __type__: 1,
  command: new SlashCommandBuilder()
    .setName('giveaway-notify')
    .setDescription('Çekiliş bildirimi almak isteyenler için sabit mesaj oluşturur.')
    .addChannelOption(option =>
      option.setName('kanal')
        .setDescription('Mesajın gönderileceği kanal')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  run: async (client, interaction) => {
    const channel = interaction.options.getChannel('kanal');
    const guild = interaction.guild;

    let role = guild.roles.cache.find(r => r.name === NOTIFY_ROLE_NAME);
    if (!role) {
      role = await guild.roles.create({
        name: NOTIFY_ROLE_NAME,
        reason: 'Çekiliş bildirimi almak isteyenler icin rol oluşturuldu.'
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎉 Çekiliş Bildirimleri')
      .setDescription('Çekilişlerden haberdar olmak icin bu mesaja 🎉 emojisi ile tepki ver!')
      .setColor('Gold');

    const notifyMessage = await channel.send({ embeds: [embed] });
    await notifyMessage.react('🎉');

    const settings = fs.existsSync(SETTINGS_PATH)
      ? JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'))
      : {};

    settings.notifyMessageId = notifyMessage.id;
    settings.notifyChannelId = channel.id;
    settings.notifyRoleId = role.id;

    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));

    await interaction.reply({ content: '✅ Bildirim sistemi aktif edildi!', ephemeral: true });
  }
};
