// src/utils/cleanGlobalCommands.js

const { REST, Routes } = require('discord.js');
require('dotenv').config();

const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID;

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('🧹 Global komutlar temizleniyor...');
    const commands = await rest.get(Routes.applicationCommands(clientId));

    for (const cmd of commands) {
      await rest.delete(Routes.applicationCommand(clientId, cmd.id));
      console.log(`❌ Silindi: ${cmd.name}`);
    }

    console.log('✅ Tüm global komutlar silindi.');
  } catch (err) {
    console.error('Bir hata oluştu:', err);
  }
})();
