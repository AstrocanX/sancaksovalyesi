// src/events/guildMemberAdd.js
module.exports = {
  __type__: 5, // <-- required for your loader
  event: 'guildMemberAdd', // not Events.GuildMemberAdd
  once: false, // true if it should fire only once
  run: async (client, member) => {
    const rolID = '1360068557941243904'; // replace with your actual role ID

    try {
      await member.roles.add(rolID);
      console.log(`[+] ${member.user.tag} kullanıcısına Oyuncu rolü verildi.`);
    } catch (err) {
      console.error(`[-] ${member.user.tag} için rol verilemedi:`, err);
    }
  }
};
