const { ActivityType } = require('discord.js');

module.exports = async (bot) => {
    console.log(`${bot.user.tag} is online.`)
    bot.user.setPresence({
        activities: [{
            name: 'Project Desert Phoenix',
            type: ActivityType.Watching,
        }],
        status: 'online'
    })
}