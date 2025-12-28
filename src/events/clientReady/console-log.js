"use strict";

const { ActivityType } = require('discord.js');

module.exports = async (bot) => {
    console.log(`Logged into ${bot.user.username} successfully!`)
    bot.user.setPresence({
        activities: [{
            name: 'Project Desert Phoenix',
            type: ActivityType.Watching,
        }],
        status: 'online'
    })
}