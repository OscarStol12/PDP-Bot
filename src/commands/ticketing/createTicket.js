"use strict";

const {
    SlashCommandBuilder,
    EmbedBuilder,
    Colors,
    MessageFlags,
    ChannelType,
    ChatInputCommandInteraction,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    User,
    PermissionFlagsBits,
    Attachment
} = require('discord.js');

const TranscriptGenerator = require('discord-html-transcripts');
const TicketMetadata = require(`${PROJECT_ROOT}/data/TicketMetadata`);
const config = require(`${PROJECT_ROOT}/config.json`);

module.exports = {
    data: new SlashCommandBuilder()
    .setName('create-ticket')
    .setDescription('Creates a new ticket.')
    .addStringOption(opt =>
        opt.setName('reason')
        .setDescription('The reason to open the ticket for.')
        .setRequired(true)
    ),

    /**
     * @param {Object} param0
     * @param {ChatInputCommandInteraction} param0.interaction 
     */
    run: async ({ interaction }) => {
        try {
            const ticketReason = interaction.options.getString('reason');
            let newChannel = await interaction.guild.channels.create({
                name: `ticket-${ticketReason}`.replaceAll(' ', '-'),
                type: ChannelType.GuildText,
                parent: config.categories.ticketing[process.env.THIS_ENVIRONMENT],
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        allow: [PermissionFlagsBits.SendMessages],
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: config.roles.moderator[process.env.THIS_ENVIRONMENT],
                        allow: [PermissionFlagsBits.ViewChannel],
                    },
                ]
            })
            
            const thisTicketMetadata = new TicketMetadata({
                ticket_id: newChannel.id,
                ticket_owner: interaction.user.id,
                claimant: "",
            })

            await thisTicketMetadata.save();

            let controlsEmbed = new EmbedBuilder()
            .setTitle(`ℹ️ Ticket Controls`)
            .setDescription(`🙋 - **Claim**\n\n🔒 - **Lock**\n\n🔓 - **Unlock**\n\n📋 - **Transcript**\n\n🔨 - **Delete**`)
            .setColor(Colors.Aqua)
            .setTimestamp();

            const ticketOptions = [
                {text: 'Claim', emoji: '🙋'},
                {text: 'Lock', emoji: '🔒'},
                {text: 'Unlock', emoji: '🔓'},
                {text: 'Transcript', emoji: '📋'},
                {text: 'Delete', emoji: '🔨'},
            ]

            const buttons = ticketOptions.map((each) => {
                return new ButtonBuilder()
                .setCustomId(each.text)
                .setLabel(each.text)
                .setStyle(ButtonStyle.Primary)
                .setEmoji(each.emoji);
            });

            let sentMsg = await newChannel.send({
                embeds: [controlsEmbed],
                components: [new ActionRowBuilder().addComponents(buttons)],
            });

            let successEmbed = new EmbedBuilder()
            .setTitle(`✅ Ticket Successfully Created`)
            .setDescription(`Your ticket has been successfully created at <#${newChannel.id}>.`)
            .setColor(Colors.Green)
            .setTimestamp();

            await interaction.reply({embeds: [successEmbed], flags: MessageFlags.Ephemeral});

            /**
             * @param {GuildMember} member 
             * @returns {boolean}
             */
            const isStaff = (member) => {
                return (
                    member.roles.cache.has(config.roles.moderator[process.env.THIS_ENVIRONMENT]) ||
                    member.roles.cache.has(config.roles.developer[process.env.THIS_ENVIRONMENT])
                )
            }

            /**
             * @param {User} user 
             * @returns {boolean}
             */
            const isTicketOwner = (user) => {
                return user.id === thisTicketMetadata.ticket_owner;
            }

            const collector = sentMsg.createMessageComponentCollector({});
            collector.on('collect', async (i) => {
                switch (i.customId) {
                    case 'Claim': {
                        if (!isStaff(i.member)) {
                            let embed = new EmbedBuilder()
                            .setTitle(`⛔ Access Denied`)
                            .setDescription(`You may not claim this ticket since you are not a staff member.`)
                            .setColor(Colors.Red)
                            .setTimestamp();

                            return await i.reply({
                                embeds: [embed],
                                flags: MessageFlags.Ephemeral,
                            });
                        }

                        if (thisTicketMetadata.claimant !== "") {
                            let embed = new EmbedBuilder()
                            .setTitle(`❌ Ticket Claimed`)
                            .setDescription(`<@${thisTicketMetadata.claimant}> has already claimed this ticket.`)
                            .setColor(Colors.Red)
                            .setTimestamp();

                            return await i.reply({
                                embeds: [embed],
                                flags: MessageFlags.Ephemeral,
                            });
                        }

                        if (i.user.id === thisTicketMetadata.ticket_owner) {
                            let embed = new EmbedBuilder()
                            .setTitle(`❌ Cannot Claim`)
                            .setDescription(`You cannot claim your own ticket.`)
                            .setColor(Colors.Red)
                            .setTimestamp();

                            return await i.reply({
                                embeds: [embed],
                                flags: MessageFlags.Ephemeral,
                            })
                        }

                        thisTicketMetadata.claimant = i.user.id;
                        thisTicketMetadata.save();

                        let embed = new EmbedBuilder()
                        .setTitle(`✅ Claim Success`)
                        .setDescription(`You have successfully claimed this ticket.`)
                        .setColor(Colors.Green)
                        .setTimestamp();

                        await i.reply({embeds: [embed], flags: MessageFlags.Ephemeral});

                        let publicEmbed = new EmbedBuilder()
                        .setTitle(`🙋 Ticket Claimed`)
                        .setDescription(`<@${thisTicketMetadata.claimant}> has claimed your ticket, and is ready to help you!`)
                        .setColor(Colors.Yellow)
                        .setTimestamp();

                        await newChannel.send({
                            content: `<@${thisTicketMetadata.ticket_owner}>`,
                            embeds: [publicEmbed]
                        });

                        break;
                    }

                    case 'Lock': {
                        if (!isStaff(i.member)) {
                            let embed = new EmbedBuilder()
                            .setTitle(`⛔ Access Denied`)
                            .setDescription(`You are not a Staff Member, so you may not lock this ticket.`)
                            .setColor(Colors.Red)
                            .setTimestamp();

                            return await i.reply({
                                embeds: [embed],
                                flags: MessageFlags.Ephemeral,
                            })
                        }

                        let channelPermissions = newChannel.permissionsFor(newChannel.guild.roles.everyone);
                        if (!channelPermissions.has(PermissionFlagsBits.SendMessages)) {
                            let embed = new EmbedBuilder()
                            .setTitle(`❌ Already Locked`)
                            .setDescription(`This ticket has already been locked.`)
                            .setColor(Colors.Red)
                            .setTimestamp();

                            return await i.reply({
                                embeds: [embed],
                                flags: MessageFlags.Ephemeral,
                            })
                        }

                        await newChannel.permissionOverwrites.create(newChannel.guild.roles.everyone, {
                            ViewChannel: false,
                            SendMessages: false,
                        })

                        let embed = new EmbedBuilder()
                        .setTitle(`✅ Lock Success`)
                        .setDescription(`This ticket has been successfully locked.`)
                        .setColor(Colors.Green)
                        .setTimestamp();

                        await i.reply({embeds: [embed], flags: MessageFlags.Ephemeral});

                        let publicEmbed = new EmbedBuilder()
                        .setTitle(`🔒 Ticket Locked`)
                        .setDescription(`${i.user} has locked this ticket.`)
                        .setColor(Colors.Red)
                        .setTimestamp();

                        await newChannel.send({embeds: [publicEmbed]});
                        break;
                    }

                    case 'Unlock': {
                        if (!isStaff(i.member)) {
                            let embed = new EmbedBuilder()
                            .setTitle(`⛔ Access Denied`)
                            .setDescription(`You are not a Staff Member, so you may not unlock this ticket.`)
                            .setColor(Colors.Red)
                            .setTimestamp();

                            return await i.reply({
                                embeds: [embed],
                                flags: MessageFlags.Ephemeral,
                            })
                        }

                        let channelPermissions = newChannel.permissionsFor(newChannel.guild.roles.everyone);
                        if (channelPermissions.has(PermissionFlagsBits.SendMessages)) {
                            let embed = new EmbedBuilder()
                            .setTitle(`❌ Not Locked`)
                            .setDescription(`This ticket is currently unlocked.`)
                            .setColor(Colors.Red)
                            .setTimestamp();

                            return await i.reply({
                                embeds: [embed],
                                flags: MessageFlags.Ephemeral
                            });
                        }

                        await newChannel.permissionOverwrites.create(newChannel.guild.roles.everyone, {
                            ViewChannel: false,
                            SendMessages: true,
                        })

                        let embed = new EmbedBuilder()
                        .setTitle(`✅ Unlock Successful`)
                        .setDescription(`This ticket has been successfully unlocked.`)
                        .setColor(Colors.Green)
                        .setTimestamp();

                        await i.reply({embeds: [embed], flags: MessageFlags.Ephemeral});

                        let publicEmbed = new EmbedBuilder()
                        .setTitle(`🔓 Ticket Unlocked`)
                        .setDescription(`${i.user} has unlocked this ticket.`)
                        .setColor(Colors.Yellow)
                        .setTimestamp();

                        await newChannel.send({embeds: [publicEmbed]});
                        break;
                    }

                    case 'Transcript': {
                        if (!isStaff(i.member)) {
                            let embed = new EmbedBuilder()
                            .setTitle(`⛔ Access Denied`)
                            .setDescription(`You are not a Staff Member, so you cannot save transcripts of this channel yourself.`)
                            .setColor(Colors.Red)
                            .setTimestamp();

                            return await i.reply({
                                embeds: [embed],
                                flags: MessageFlags.Ephemeral,
                            })
                        }

                        let transcript = await TranscriptGenerator.createTranscript(newChannel, {
                            limit: -1,
                            returnType: Attachment,
                            filename: `transcript-${newChannel.name}-${Date.now()}.html`,
                            saveImages: true,
                            poweredBy: false,
                        });
                        
                        let receivingChannel = await interaction.client.channels.fetch(config.channels.logging.transcripts[process.env.THIS_ENVIRONMENT]);
                        
                        let transcriptEmbed = new EmbedBuilder()
                        .setTitle(`📋 Transcript for ${newChannel.name}`)
                        .setDescription(`Ticket Owner: <@${thisTicketMetadata.ticket_owner}>\nClaimed by: ${(thisTicketMetadata.claimant !== "")?`<@${thisTicketMetadata.claimant}>`:`Nobody`}`)
                        .setColor(Colors.Aqua)
                        .setTimestamp();

                        await receivingChannel.send({
                            embeds: [transcriptEmbed],
                            files: [transcript],
                        });

                        let embed = new EmbedBuilder()
                        .setTitle(`✅ Transcript Saved`)
                        .setDescription(`A transcript has been successfully created and stored.`)
                        .setColor(Colors.Green)
                        .setTimestamp();

                        await i.reply({embeds: [embed], flags: MessageFlags.Ephemeral});

                        let publicEmbed = new EmbedBuilder()
                        .setTitle(`📋 Transcript Generated`)
                        .setDescription(`${i.user} has generated a transcript of this ticket.`)
                        .setColor(Colors.Yellow)
                        .setTimestamp();

                        await newChannel.send({embeds: [publicEmbed]});
                        break;
                    }

                    case 'Delete': {
                        if (!isStaff(i.member) && !isTicketOwner(i.user)) {
                            let embed = new EmbedBuilder()
                            .setTitle(`⛔ Access Denied`)
                            .setDescription(`You do not have the proper permissions to delete this ticket.`)
                            .setColor(Colors.Red)
                            .setTimestamp();

                            return await i.reply({
                                embeds: [embed],
                                flags: MessageFlags.Ephemeral,
                            })
                        }

                        let publicEmbed = new EmbedBuilder()
                        .setTitle(`🔨 Deleting Ticket`)
                        .setDescription(`${i.user} has started ticket deletion. This ticket will be deleted in 5 seconds.`)
                        .setColor(Colors.Red)
                        .setTimestamp();

                        await newChannel.send({embeds: [publicEmbed]});
                        setTimeout(() => {
                            collector.stop();
                            newChannel.delete();
                        }, 5000);
                        break;
                    }
                }
            })
        } catch (e) {
            let embed = new EmbedBuilder()
            .setTitle('❌ Error')
            .setDescription(`An error occured while generating the ticket: ${e}`)
            .setColor(Colors.Red)
            .setTimestamp();

            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return;
        }
    },
}