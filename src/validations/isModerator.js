'use strict';

const { EmbedBuilder, Colors, MessageFlags } = require('discord.js');

module.exports = async (interaction, commandObj) => {
    let executor = await interaction.guild.members.fetch(interaction.user.id);

    if (commandObj.reqs && commandObj.reqs.isModOnly) {
        if (!executor.roles.cache.has('1442704253972906064')) {
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