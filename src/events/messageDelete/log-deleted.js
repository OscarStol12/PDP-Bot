"use strict";

const {EmbedBuilder, Colors} = require('discord.js');
const config = require(`${PROJECT_ROOT}/config.json`);

module.exports = async (msg) => {
    let channel = await msg.client.channels.fetch(config.channels.logging.message);
    if (!msg.system) {
        let embed = new EmbedBuilder()
        .setTitle(`🔨 Message Deleted`)
        .addFields({
            name: `Author`, 
            value: `<@${msg.author.id}>`,
        })
        .addFields({
            name: `Channel`,
            value: `<#${msg.channelId}>`,
        })
        .addFields({
            name: `Contents`,
            value: msg.content,
        })
        .setColor(Colors.Red)
        .setThumbnail(msg.author.displayAvatarURL({ size: 1024 }))
        .setTimestamp();

        await channel.send({embeds: [embed]});
    }
}