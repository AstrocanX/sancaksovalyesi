// src/core/CommandsHandler.js

const { REST, Routes } = require('discord.js');
const { info, error, success } = require('../../utils/Console');
const { readdirSync, existsSync, readFileSync } = require('fs');
const path = require('path');

class CommandsHandler {
    constructor(client) {
        this.client = client;
        this.client.rest_application_commands_array = [];
    }

    load = () => {
        this.client.rest_application_commands_array = [];

        for (const directory of readdirSync('./src/commands/')) {
            for (const file of readdirSync(`./src/commands/${directory}`).filter(f => f.endsWith('.js'))) {
                let modules = require(`../../commands/${directory}/${file}`);
                if (!Array.isArray(modules)) modules = [modules];

                for (const module of modules) {
                    if (module?.__type__ === 1 && module.command && module.run) {
                        this.client.collection.application_commands.set(module.command.name, module);
                        this.client.rest_application_commands_array.push(module.command);
                        info(`Loaded new application command: ${module.command.name}`);
                    }
                }
            }
        }

        success(`Loaded ${this.client.rest_application_commands_array.length} application commands.`);
    }

    registerApplicationCommands = async (development) => {
        const rest = new REST({ version: '10' }).setToken(this.client.token);

        const permissionsPath = path.join(__dirname, '../../data/permissions.json');
        const permissionsData = existsSync(permissionsPath)
            ? JSON.parse(readFileSync(permissionsPath, 'utf8'))
            : {};

        const commandPayload = this.client.rest_application_commands_array.map(cmd => {
            if (typeof cmd.toJSON !== 'function') {
               
                return null;
            }

            const allowedRoles = permissionsData[cmd.name];

            return {
                ...cmd.toJSON(),
                default_member_permissions: allowedRoles?.length > 0 ? '0' : undefined,
                dm_permission: false
            };
        }).filter(Boolean);
        await rest.put(
            Routes.applicationGuildCommands(this.client.user.id, development.guildId),
            { body: commandPayload }
        );

        success("Registered commands for guild ID: " + development.guildId);
    }
}

module.exports = CommandsHandler;
