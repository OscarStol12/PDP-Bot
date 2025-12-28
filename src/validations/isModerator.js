'use strict';

const { EmbedBuilder, Colors, MessageFlags } = require('discord.js');
const config = require(`${PROJECT_ROOT}/config.json`);

/**
* @param {Object} param0
* @param {ChatInputCommandInteraction} param0.interaction 
*/
module.exports = async (interaction, commandObj) => {
    let executor = await interaction.guild.members.fetch(interaction.user.id);

    if (commandObj.reqs && commandObj.reqs.isModOnly) {
        if (!executor.roles.cache.has(config.roles.moderator[process.env.THIS_ENVIRONMENT])) {
            let embed = new EmbedBuilder()
            .setTitle(`⛔ Access Denied`)
            .setDescription(`You do not have moderator permissions.`)
            .setColor(Colors.Red)
            .setTimestamp();
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return true;
        }
    }
}