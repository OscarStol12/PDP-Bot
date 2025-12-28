'use strict';

const { SlashCommandBuilder, EmbedBuilder, MessageFlags, Colors, ChatInputCommandInteraction } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription(`Gets a user's profile picture.`)
    .addUserOption((opt) => 
        opt.setName('user')
        .setDescription(`The user to get the avatar of.`)
        .setRequired(true)
    ),

    /**
     * @param {Object} param0
     * @param {ChatInputCommandInteraction} param0.interaction 
     */
    run: async ({ interaction }) => {
        let target = interaction.options.getUser('user');

        try {
            // Check to see if the target member is in the server
            if (interaction.guild.members.cache.get(target.id) === undefined) {
                let embed = new EmbedBuilder()
                .setTitle(`❌ Error`)
                .setDescription(`<@${target}> is not in this server.`)
                .setColor(Colors.Red)
                .setTimestamp();
                await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
                return;
            }

            let embed = new EmbedBuilder()
            .setTitle(`📸 User Avatar`)
            .setImage(target.displayAvatarURL({ size: 1024 }))
            .setColor(Colors.Yellow)
            .setTimestamp();
            await interaction.reply({embeds: [embed]});
        } catch (e) {
            let embed = new EmbedBuilder()
            .setTitle(`❌ Error`)
            .setDescription(`Failed to get user avatar: ${e}`)
            .setColor(Colors.Red)
            .setTimestamp();
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
        }
    },
}