const { info, error, success } = require('../../utils/Console');
const { readdirSync, lstatSync } = require('fs');
const path = require('path'); // ✅ FIXED: moved to top
const DiscordBot = require('../DiscordBot');
const Component = require('../../structure/Component');
const AutocompleteComponent = require('../../structure/AutocompleteComponent');
const Event = require('../../structure/Event');

class EventsHandler {
    client;

    /**
     *
     * @param {DiscordBot} client
     */
    constructor(client) {
        this.client = client;
    }

    load = () => {
        let total = 0;
        const eventsPath = path.join(__dirname, '../../events');

        for (const item of readdirSync(eventsPath)) {
            const fullPath = path.join(eventsPath, item);
            const isDirectory = lstatSync(fullPath).isDirectory();

            if (isDirectory) {
                for (const file of readdirSync(fullPath).filter(f => f.endsWith('.js'))) {
                    this._loadEvent(path.join(item, file), path.join(fullPath, file));
                    total++;
                }
            } else if (item.endsWith('.js')) {
                this._loadEvent(item, fullPath);
                total++;
            }
        }

        success(`Successfully loaded ${total} events.`);
    }

    _loadEvent = (logName, filePath) => {
        try {
            const module = require(filePath);
            if (!module) return;

            if (module.__type__ === 5) {
                if (!module.event || !module.run) {
                    error('Unable to load the event ' + logName);
                    return;
                }

                if (module.once) {
                    this.client.once(module.event, (...args) => module.run(this.client, ...args));
                } else {
                    this.client.on(module.event, (...args) => module.run(this.client, ...args));
                }

                info(`Loaded new event: ${logName}`);
            } else {
                error('Invalid event type ' + module.__type__ + ' from event file ' + logName);
            }
        } catch (err) {
            error('Unable to load an event from: ' + logName);
            console.error(err);
        }
    }
}

module.exports = EventsHandler;
