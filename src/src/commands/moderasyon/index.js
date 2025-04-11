const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ms = require('ms');
const logChannelId = '1360028184954933408';

function sendLog(interaction, title, fields, color = 'Blurple') {
    const logChannel = interaction.guild.channels.cache.get(logChannelId);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle(title)
        .addFields(...fields)
        .setColor(color)
        .setFooter({ text: `Yetkili: ${interaction.user.tag}` })
        .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(console.error);
}

async function hasPermission(interaction) {
    const target = interaction.options.getMember?.('kullanıcı') ||
        interaction.options.getMember?.('user') ||
        interaction.options.getMember?.('target') ||
        null;

    if (target) {
        const isOwner = interaction.user.id === interaction.guild.ownerId;
        const userPos = interaction.member.roles.highest.position;
        const targetPos = target.roles.highest.position;

        if (!isOwner && userPos <= targetPos) {
            await interaction.reply({
                content: '❌ Bu kişiye işlem yapamazsın. Yetkisi senden yüksek ya da eşit.',
                ephemeral: true
            });
            return false;
        }
    }
    return true;
}

module.exports = [
    {
        __type__: 1,
        command: new SlashCommandBuilder()
            .setName('mute')
            .setDescription('Bir kullanıcıyı geçici olarak susturur.')
            .addUserOption(opt => opt.setName('kullanıcı').setDescription('Susturulacak kişi').setRequired(true))
            .addIntegerOption(opt => opt.setName('gün').setDescription('Kaç gün').setRequired(false))
            .addIntegerOption(opt => opt.setName('saat').setDescription('Kaç saat').setRequired(false))
            .addIntegerOption(opt => opt.setName('dakika').setDescription('Kaç dakika').setRequired(false))
            .addStringOption(opt => opt.setName('sebep').setDescription('Sebep')),
        run: async (client, interaction) => {
            if (!hasPermission(interaction)) return;
            const user = interaction.options.getUser('kullanıcı');
            const gün = interaction.options.getInteger('gün') || 0;
            const saat = interaction.options.getInteger('saat') || 0;
            const dakika = interaction.options.getInteger('dakika') || 0;
            const sebep = interaction.options.getString('sebep') || 'Belirtilmedi';

            const totalMs = ((gün * 24 * 60) + (saat * 60) + dakika) * 60 * 1000;
            if (totalMs <= 0) return interaction.reply({ content: 'Lütfen geçerli bir süre belirtin!', ephemeral: true });

            const member = await interaction.guild.members.fetch(user.id);
            if (!checkHierarchy(interaction, member)) return interaction.reply({ content: '❌ Kendinden yüksek yetkideki birine işlem yapamazsın.', ephemeral: true });
            if (!member.moderatable) return interaction.reply({ content: 'Bu kullanıcıyı susturamam.', ephemeral: true });

            const sureYazi = `${gün ? `${gün} gün ` : ''}${saat ? `${saat} saat ` : ''}${dakika ? `${dakika} dakika` : ''}`.trim();

            try {
                await user.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('🔇 Susturuldun')
                            .addFields(
                                { name: 'Sunucu', value: interaction.guild.name },
                                { name: 'Süre', value: sureYazi },
                                { name: 'Sebep', value: sebep }
                            )
                            .setColor('Orange')
                            .setFooter({ text: `Yetkili: ${interaction.user.tag}` })
                            .setTimestamp()
                    ]
                });
            } catch {}

            await member.timeout(totalMs, sebep);
            await interaction.reply(`${user.tag} ${sureYazi} boyunca susturuldu.`);

            sendLog(interaction, '🔇 Kullanıcı Susturuldu', [
                { name: 'Kullanıcı', value: `${user.tag} (${user.id})` },
                { name: 'Süre', value: sureYazi },
                { name: 'Sebep', value: sebep }
            ], 'Orange');
        }
    },
    {
        __type__: 1,
        command: new SlashCommandBuilder()
            .setName('ban')
            .setDescription('Bir kullanıcıyı yasaklar.')
            .addUserOption(opt => opt.setName('kullanıcı').setDescription('Banlanacak kişi').setRequired(true))
            .addStringOption(opt => opt.setName('sebep').setDescription('Sebep')),
        run: async (client, interaction) => {
            if (!hasPermission(interaction)) return;
            const user = interaction.options.getUser('kullanıcı');
            const sebep = interaction.options.getString('sebep') || 'Belirtilmedi';

            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            if (member && !checkHierarchy(interaction, member)) {
                return interaction.reply({ content: '❌ Kendinden yüksek yetkideki birine işlem yapamazsın.', ephemeral: true });
            }

            try {
                await user.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('⛔ Sunucudan Banlandın')
                            .addFields(
                                { name: 'Sunucu', value: interaction.guild.name, inline: true },
                                { name: 'Sebep', value: sebep, inline: true }
                            )
                            .setColor('Red')
                            .setFooter({ text: `Yetkili: ${interaction.user.tag}` })
                            .setTimestamp()
                    ]
                });
            } catch (err) {
                console.warn(`Kullanıcıya DM gönderilemedi: ${user.tag}`);
            }

            await interaction.guild.members.ban(user.id, { reason: sebep });
            await interaction.reply(`${user.tag} sunucudan banlandı. Sebep: ${sebep}`);

            sendLog(interaction, '⛔ Kullanıcı Banlandı', [
                { name: 'Kullanıcı', value: `${user.tag} (${user.id})`, inline: true },
                { name: 'Sebep', value: sebep }
            ], 'Red');
        }
    },
    {
        __type__: 1,
        command: new SlashCommandBuilder()
            .setName('unmute')
            .setDescription('Bir kullanıcının susturmasını kaldırır.')
            .addUserOption(opt => opt.setName('kullanıcı').setDescription('Kaldırılacak kişi').setRequired(true)),
        run: async (client, interaction) => {
            if (!hasPermission(interaction)) return;
            const user = interaction.options.getUser('kullanıcı');
            const member = await interaction.guild.members.fetch(user.id);

            if (!member.moderatable) return interaction.reply({ content: 'Bu kullanıcıya işlem yapamam.', ephemeral: true });

            await member.timeout(null);
            await interaction.reply(`${user.tag} artık susturulmadı.`);

            try {
                await user.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('🔊 Susturman Kaldırıldı')
                            .addFields({ name: 'Sunucu', value: interaction.guild.name })
                            .setColor('Green')
                            .setFooter({ text: `Yetkili: ${interaction.user.tag}` })
                            .setTimestamp()
                    ]
                });
            } catch {}

            sendLog(interaction, '🔊 Kullanıcı Susturması Kaldırıldı', [
                { name: 'Kullanıcı', value: `${user.tag} (${user.id})` }
            ], 'Green');
        }
    },
    {
        __type__: 1,
        command: new SlashCommandBuilder()
            .setName('unban')
            .setDescription('Yasaklı bir kullanıcının yasağını kaldırır.')
            .addStringOption(opt => opt.setName('kullanıcı_id').setDescription('ID giriniz').setRequired(true)),
        run: async (client, interaction) => {
            if (!hasPermission(interaction)) return;
            const id = interaction.options.getString('kullanıcı_id');

            try {
                await interaction.guild.members.unban(id);
                await interaction.reply(`${id} adlı kişinin yasağı kaldırıldı.`);

                try {
                    const user = await client.users.fetch(id);
                    await user.send({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('✅ Banın Kaldırıldı')
                                .addFields({ name: 'Sunucu', value: interaction.guild.name })
                                .setColor('Blue')
                                .setFooter({ text: `Yetkili: ${interaction.user.tag}` })
                                .setTimestamp()
                        ]
                    });
                } catch {}

                sendLog(interaction, '✅ Kullanıcının Yasağı Kaldırıldı', [
                    { name: 'Kullanıcı ID', value: id }
                ], 'Blue');
            } catch {
                await interaction.reply({ content: 'Geçerli bir kullanıcı ID gir.', ephemeral: true });
            }
        }
    },
    {
        __type__: 1,
        command: new SlashCommandBuilder()
            .setName('slowmode')
            .setDescription('Kanal için yavaş mod ayarla.')
            .addIntegerOption(opt => opt.setName('saniye').setDescription('Kaç saniye olacak (0 = kapat)').setRequired(true)),
        run: async (client, interaction) => {
            if (!hasPermission(interaction)) return;
            const saniye = interaction.options.getInteger('saniye');
            await interaction.channel.setRateLimitPerUser(saniye);
            await interaction.reply(`Yavaş mod **${saniye}** saniye olarak ayarlandı.`);

            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('🐢 Yavaş Mod Ayarlandı')
                    .addFields(
                        { name: 'Kanal', value: `<#${interaction.channel.id}>`, inline: true },
                        { name: 'Süre', value: `${saniye} saniye`, inline: true }
                    )
                    .setColor('Blurple')
                    .setFooter({ text: `Yetkili: ${interaction.user.tag}` })
                    .setTimestamp();
                logChannel.send({ embeds: [embed] });
            }
        }
    },
    {
        __type__: 1,
        command: new SlashCommandBuilder()
            .setName('clear')
            .setDescription('Belirli sayıda mesaj siler (Maks 100).')
            .addIntegerOption(opt => opt.setName('adet').setDescription('Silinecek mesaj sayısı').setRequired(true)),
        run: async (client, interaction) => {
            if (!hasPermission(interaction)) return;
            const adet = interaction.options.getInteger('adet');
            const silinen = await interaction.channel.bulkDelete(adet, true);

            await interaction.reply({ content: `${silinen.size} mesaj silindi.`, ephemeral: true });

            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('🧹 Mesajlar Silindi')
                    .addFields(
                        { name: 'Adet', value: `${silinen.size}`, inline: true },
                        { name: 'Kanal', value: `<#${interaction.channel.id}>`, inline: true }
                    )
                    .setColor('Grey')
                    .setFooter({ text: `Yetkili: ${interaction.user.tag}` })
                    .setTimestamp();
                logChannel.send({ embeds: [embed] });
            }
        }
    },
    {
        __type__: 1,
        command: new SlashCommandBuilder()
            .setName('lock')
            .setDescription('Kanalı yazışmaya kapatır.'),
        run: async (client, interaction) => {
            if (!hasPermission(interaction)) return;
            await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
            await interaction.reply('🔒 Kanal kilitlendi.');

            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('🔒 Kanal Kilitlendi')
                    .addFields({ name: 'Kanal', value: `<#${interaction.channel.id}>` })
                    .setColor('DarkRed')
                    .setFooter({ text: `Yetkili: ${interaction.user.tag}` })
                    .setTimestamp();
                logChannel.send({ embeds: [embed] });
            }
        }
    },
    {
        __type__: 1,
        command: new SlashCommandBuilder()
            .setName('unlock')
            .setDescription('Kanalı yazışmaya açar.'),
        run: async (client, interaction) => {
            if (!hasPermission(interaction)) return;
            await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
            await interaction.reply('🔓 Kanal kilidi kaldırıldı.');

            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('🔓 Kanal Açıldı')
                    .addFields({ name: 'Kanal', value: `<#${interaction.channel.id}>` })
                    .setColor('Green')
                    .setFooter({ text: `Yetkili: ${interaction.user.tag}` })
                    .setTimestamp();
                logChannel.send({ embeds: [embed] });
            }
        }
    }
];
