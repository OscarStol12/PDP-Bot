'use strict';

const { EmbedBuilder, Colors, MessageFlags } = require('discord.js');

module.exports = async (interaction, commandObj) => {
    let executor = await interaction.guild.members.fetch(interaction.user.id);

    if (commandObj.reqs && commandObj.reqs.isDevOnly) {
        if (!executor.roles.cache.has('1436395976935084052')) {
            let embed = new EmbedBuilder()
            .setTitle(`⛔ Access Denied`)
            .setDescription(`You do not have developer permissions.`)
            .setColor(Colors.Red)
            .setTimestamp();
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return true;
        }
    }
}