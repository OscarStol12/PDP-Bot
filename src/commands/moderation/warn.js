'use strict';

const { EmbedBuilder, SlashCommandBuilder, MessageFlags, Colors } = require('discord.js');
const warningsDB = require(`${PROJECT_ROOT}/data/UserWarnings`);
const config = require(`${PROJECT_ROOT}/config.json`);

module.exports = {
    data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warns a user for an action they committed.')
    .addUserOption((opt) =>
        opt.setName('user')
        .setDescription('The user to warn.')
        .setRequired(true)
    )
    .addStringOption((opt) =>
        opt.setName('reason')
        .setDescription('The reason to warn the user for.')
        .setRequired(true)
    ),

    run: async ({ interaction }) => {
        let target = interaction.options.get('user')?.value;
        let executor = await interaction.guild.members.fetch(interaction.user.id);
        let warnReason = interaction.options.get('reason')?.value;

        try {
            // Check to see if the target member is in the server
            if (interaction.guild.members.cache.get(target) === undefined) {
                let embed = new EmbedBuilder()
                .setTitle(`❌ Error`)
                .setDescription(`<@${target}> is not in this server. You cannot warn users who are currently not in the server. If they are attempting to evade punishment, consider using the /ban command instead.`)
                .setColor(Colors.Red)
                .setTimestamp();
                await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
                return;
            }

            // Find a database entry for the user's warnings, if not create a new database
            target = await interaction.guild.members.fetch(target);
            const query = {
                discordId: target.id,
            };

            let userWarnings = await warningsDB.findOne(query);
            if (!userWarnings) {
                userWarnings = new warningsDB({
                    discordId: target.id,
                    nextWarningId: 1,
                    warnings: [],
                })

                await userWarnings.save();
            }

            // Append the new warning to the user's warning database
            let thisWarningId = userWarnings.nextWarningId;
            let currentTime = parseInt(Date.now().valueOf() / 1000);
            await warningsDB.updateOne(
                {discordId: target.id},
                {
                    $push: {
                        warnings: {
                            id: userWarnings.nextWarningId,
                            moderator: executor.id,
                            reason: warnReason,
                            timestamp: currentTime,
                        }
                    },
                    $inc: {nextWarningId: 1}
                },
            )

            // Send a DM to the target, letting them know they were warned
            let DMSuccess = false;
            try {
                let targetRecv = new EmbedBuilder()
                .setTitle(`⚠️ Warning`)
                .setDescription(`You were warned in the Project Desert Phoenix server.`)
                .addFields({name: `Reason`, value: warnReason})
                .addFields({name: `Executor`, value: `<@${executor.id}>`})
                .addFields({name: `Warning ID`, value: `${thisWarningId}`})
                .addFields({name: `Timestamp`, value: `<t:${currentTime}:F>`})
                .setColor(Colors.Yellow)
                .setTimestamp();
                await target.send({embeds: [targetRecv]});
                DMSuccess = true;
            } catch (e) {
                console.log(`Failed to DM ${target.id}: ${e}`);
            }

            // Log the warning
            const loggingChannel = await interaction.client.channels.fetch(config.channels.logging.moderation);
            let loggingEmbed = new EmbedBuilder()
            .setTitle(`🚨 Warning Log`)
            .addFields({
                name: `Executor`,
                value: `<@${executor.id}>`,
            })
            .addFields({
                name: `Target`,
                value: `<@${target.id}>`
            })
            .addFields({
                name: `Reason`,
                value: warnReason,
            })
            .addFields({
                name: `Warning ID`,
                value: `${thisWarningId}`,
            })
            .addFields({
                name: `Timestamp`,
                value: `<t:${currentTime}:F>`
            })
            .setThumbnail(target.displayAvatarURL({ size: 1024 }))
            .setColor(Colors.Blue)
            .setTimestamp();
            await loggingChannel.send({embeds: [loggingEmbed]});

            // Finally, output success (if the DM failed, let them know)
            let embed = new EmbedBuilder()
            .setTitle(`✅ Success`)
            .setDescription((DMSuccess)?`Successfully warned user <@${target.id}>.`:`Successfully warned user <@${target.id}>. However, the bot could not DM the target user.`)
            .addFields({name: `Reason`, value: warnReason})
            .addFields({name: `Executor`, value: `<@${executor.id}>`})
            .addFields({name: `Warning ID`, value: `${thisWarningId}`})
            .addFields({name: `Timestamp`, value: `<t:${currentTime}:F>`})
            .setColor(Colors.Green)
            .setTimestamp();
            await interaction.reply({embeds: [embed]});
        } catch (e) {
            let embed = new EmbedBuilder()
            .setTitle(`❌ Error`)
            .setDescription(`An error occurred while trying to warn <@${target}>: ${e}`)
            .setColor(Colors.Red)
            .setTimestamp();
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral})
        }
    },

    reqs: {
        isModOnly: true,
    },
}