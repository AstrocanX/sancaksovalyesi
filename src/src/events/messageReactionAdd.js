const { Events, EmbedBuilder } = require('discord.js');

const GUILD_ID = '1359237916882243614';
const MESSAGE_ID = '1360224897279856861';
const ROLE_ID = '1360223460969808076';

module.exports = {
  __type__: 5,
  event: Events.MessageReactionAdd,
  once: false,

  run: async (client, reaction, user) => {
    if (reaction.message.id !== MESSAGE_ID || user.bot) return;

    const guild = await client.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(user.id);
    const role = guild.roles.cache.get(ROLE_ID);
    if (!role || member.roles.cache.has(ROLE_ID)) return;

    await member.roles.add(ROLE_ID);

    const embed = new EmbedBuilder()
        .setTitle('🎉 Bildirim Açıldı!')
        .setDescription('Artık çekilişlerden ilk sen haberdarsın! Bol şans! 🍀')
        .setColor('Green')
        .setTimestamp();

    await user.send({ embeds: [embed] }).catch(() => {});
  }
};
