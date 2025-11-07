"use strict";

require('dotenv/config');
const { Client, IntentsBitField } = require('discord.js');
const { CommandHandler } = require('djs-commander');
const path = require('path');

const bot = new Client({ intents: [IntentsBitField.Flags.Guilds]})

new CommandHandler({
    client: bot,
    commandsPath: path.join(__dirname, 'commands'),
    eventsPath: path.join(__dirname, 'events'),
    validationsPath: path.join(__dirname, 'validations')
});

bot.login(process.env.BOT_TOKEN);