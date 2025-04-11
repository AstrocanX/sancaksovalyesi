// onReady.js
const { success } = require("../../utils/Console");
const Event = require("../../structure/Event");
const syncCommandPermissions = require("../../utils/syncCommandPermissions");
const config = require("../../config");

module.exports = new Event({
    event: 'ready',
    once: true,
    run: async (__client__, client) => {
        success(`Logged in as ${client.user.tag}`);


    }
}).toJSON();
