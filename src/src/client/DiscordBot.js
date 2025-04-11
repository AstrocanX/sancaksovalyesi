const { Client, Collection, Partials } = require("discord.js");
const CommandsHandler = require("./handler/CommandsHandler");
const { warn, error, info, success } = require("../utils/Console");
const config = require("../config");
const CommandsListener = require("./handler/CommandsListener");
const ComponentsHandler = require("./handler/ComponentsHandler");
const ComponentsListener = require("./handler/ComponentsListener");
const EventsHandler = require("./handler/EventsHandler");
const { QuickYAML } = require("quick-yaml.db");
const util = require("minecraft-server-util");

class DiscordBot extends Client {
    constructor() {
        super({
            intents: 3276799,
            partials: [
                Partials.Channel,
                Partials.GuildMember,
                Partials.Message,
                Partials.Reaction,
                Partials.User,
            ],
            presence: {
                activities: [
                    {
                        name: "keep this empty",
                        type: 4,
                        state: "Bot aktif ediliyor...",
                    },
                ],
            },
        });

        // Class fields inside constructor
        this.collection = {
            application_commands: new Collection(),
            message_commands: new Collection(),
            message_commands_aliases: new Collection(),
            components: {
                buttons: new Collection(),
                selects: new Collection(),
                modals: new Collection(),
                autocomplete: new Collection(),
            },
        };

        this.rest_application_commands_array = [];
        this.login_attempts = 0;
        this.login_timestamp = 0;

        this.commands_handler = new CommandsHandler(this);
        this.components_handler = new ComponentsHandler(this);
        this.events_handler = new EventsHandler(this);
        this.database = new QuickYAML(config.database.path);

        new CommandsListener(this);
        new ComponentsListener(this);
    }

    startStatusRotation() {
        const host = "mc.craftlime.net"; // change this to your IP or domain
        const port = 25565;

        setInterval(async () => {
            try {
                const res = await util.status(host, port);
                const playerCount = res.players.online;

                this.user.setPresence({
                    activities: [{
                        name: `${playerCount} Kişi Valoris Towny`,
                        type: 0 // Watching
                    }],
                    status: 'online'
                });

            } catch (err) {
                console.error("Failed to fetch Minecraft server status:", err);
                this.user.setPresence({
                    activities: [{
                        name: `Minecraft server offline`,
                        type: 3
                    }],
                    status: 'dnd'
                });
            }
        }, 60000); // every 10 seconds
    }

    connect = async () => {
        warn(`Attempting to connect to the Discord bot... (${this.login_attempts + 1})`);
        this.login_timestamp = Date.now();

        try {
            await this.login(process.env.BOT_TOKEN); // ✅ DOĞRU DEĞİŞKEN ADI

            this.commands_handler.load();
            this.components_handler.load();
            this.events_handler.load();
            this.startStatusRotation();

            warn("Attempting to register application commands... (this might take a while!)");
            await this.commands_handler.registerApplicationCommands(config.development);
            success("Successfully registered application commands. For specific guild? " + (config.development.enabled ? "Yes" : "No"));
        } catch (err) {
            error("Failed to connect to the Discord bot, retrying...");
            error(err);
            this.login_attempts++;
            setTimeout(this.connect, 5000);
        }
    };
}

module.exports = DiscordBot;
