"use strict";

global.File = require('file').File; // needed to ensure noblox.js will work without complaints
require('dotenv/config');
const { Client, IntentsBitField } = require('discord.js');
const { CommandHandler } = require('djs-commander');
const noblox = require('noblox.js');
const path = require('path');

const bot = new Client({ intents: [IntentsBitField.Flags.Guilds]})

new CommandHandler({
    client: bot,
    commandsPath: path.join(__dirname, 'commands'),
    eventsPath: path.join(__dirname, 'events'),
    validationsPath: path.join(__dirname, 'validations')
});

bot.login(process.env.BOT_TOKEN);

(async () => {
    try {
        await noblox.setCookie(process.env.ROBLOSECURITY);
        console.log("Logged into GroupRanker_PDP ROBLOX account successfully!");
    } catch (e) {
        console.log(`Failed to log into GroupRanker_PDP ROBLOX account: ${e}`)
    }
})();