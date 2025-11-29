'use strict';

const { EmbedBuilder, SlashCommandBuilder, Colors, MessageFlags, Message } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('create-embed')
    .setDescription(`Creates an embed in a specified channel, with the specified arguments.`)
    .addChannelOption(opt => 
        opt.setName('destination')
        .setDescription('The channel to send the embed to.')
        .setRequired(true)
    )
    .addStringOption(opt => 
        opt.setName('message')
        .setDescription(`The text to put outside the embed.`)
        .setRequired(false)
    )
    .addStringOption(opt =>
        opt.setName('header')
        .setDescription(`The title of the embed at the very top.`)
        .setRequired(false)
    )
    .addStringOption(opt => 
        opt.setName('description')
        .setDescription(`The description at the top to insert.`)
        .setRequired(false)
    )
    .addStringOption(opt =>
        opt.setName('keys')
        .setDescription(`The titles for each field. Input as semicolon-separated values, such as: "a;b;c"`)
        .setRequired(false)
    )
    .addStringOption(opt =>
        opt.setName('values')
        .setDescription(`The contents for each field. Input as semicolon-separated values, such as: "a;b;c`)
        .setRequired(false)
    )
    .addStringOption(opt =>
        opt.setName('inlines')
        .setDescription(`Determines which fields should be inline. Input as semicolon-separated values, such as: "t;t;f".`)
        .setRequired(false)
    )
    .addStringOption(opt =>
        opt.setName('color')
        .setDescription(`The color to set the embed as. Input as a hex value, such as: "#00FF00".`)
        .setRequired(false)
    )
    .addAttachmentOption(opt =>
        opt.setName('thumbnail')
        .setDescription(`The image to put in the embed as the thumbnail.`)
        .setRequired(false)
    )
    .addAttachmentOption(opt => 
        opt.setName('image')
        .setDescription(`The primary image to put in the embed.`)
        .setRequired(false)
    ),

    run: async ({ interaction }) => {
        try {
            const getIfDefined = (param) => {
                return (interaction.options.get(param))?(interaction.options.get(param)?.value):undefined;
            }

            const channel = await interaction.client.channels.fetch(interaction.options.get('destination')?.value);
            const header = getIfDefined('header');
            const description = getIfDefined('description');
            const image = interaction.options.getAttachment('image') || undefined;
            const thumbnail = interaction.options.getAttachment('thumbnail') || undefined;
            const message = getIfDefined('message');
            let color = getIfDefined('color');
            let rawKeys = getIfDefined('keys');
            let rawValues = getIfDefined('values');
            let rawInlines = getIfDefined('inlines');

            // Helper function to check if the embed specifications lead to an empty embed
            const isEmpty = () => {
                return (
                    header === undefined &&
                    description === undefined &&
                    rawKeys === undefined &&
                    rawValues === undefined &&
                    image === undefined &&
                    thumbnail === undefined
                );
            }
            
            // Helper function to validate that the color parameter given is in valid HEX
            const validateHexColor = () => {
                return color.length === 7 && /^#[0-9a-f]{6}$/i.test(color);
            }

            // Check if destination channel is text-based
            if (!channel.isTextBased()) {
                let embed = new EmbedBuilder()
                .setTitle(`❌ Error`)
                .setDescription(`The channel you specified to send the embed to is not a text-based channel. Try again, specifiying an actual text channel.`)
                .setColor(Colors.Red)
                .setTimestamp();

                await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
                return;
            }

            // Check if messages can be sent to destination channel
            if (!channel.isSendable()) {
                let embed = new EmbedBuilder()
                .setTitle(`❌ Error`)
                .setDescription(`The channel you specified to send the embed to is not a sendable channel. Try again, specifying a channel where messages can be sent.`)
                .setColor(Colors.Red)
                .setTimestamp();

                await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
                return;
            }

            // Check if embed specifications lead to an empty embed
            if (isEmpty()) {
                let embed = new EmbedBuilder()
                .setTitle(`❌ Error`)
                .setDescription(`You cannot create an empty embed. Please specify some sort of value to put in the embed.`)
                .setColor(Colors.Red)
                .setTimestamp();

                await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
                return;
            }

            // Check if color is in valid Hex format
            if (color && !validateHexColor()) {
                let embed = new EmbedBuilder()
                .setTitle(`❌ Error`)
                .setDescription(`The Hex color you specified: "${color}" is an invalid Hex color. Please try again with a proper hex color.`)
                .setColor(Colors.Red)
                .setTimestamp();

                await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
                return;
            }

            // Check if values are given, then keys exist
            if (rawValues && !rawKeys) {
                let embed = new EmbedBuilder()
                .setTitle(`❌ Error`)
                .setDescription(`You specified field descriptions, but gave no field titles. Please try again and include properly separated field titles.`)
                .setColor(Colors.Red)
                .setTimestamp();

                await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
                return;
            }

            // Check if keys are given, then values exist
            if (rawKeys && !rawValues) {
                let embed = new EmbedBuilder()
                .setTitle(`❌ Error`)
                .setDescription(`You specified field titles, but gave no field descriptions. Please try again and include properly separated field descriptions.`)
                .setColor(Colors.Red)
                .setTimestamp();

                await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
                return;
            }

            // Check if the each key maps to each value (no missing / extra keys)
            if ((rawKeys && rawValues) && (rawKeys.match(/;/g).length != rawValues.match(/;/g).length)) {
                let embed = new EmbedBuilder()
                .setTitle(`❌ Error`)
                .setDescription(`The amount of field titles and field descriptions specified do not match up with each other. Please ensure that the amount of semicolons in both the field titles and descriptions parameters match.`)
                .setColor(Colors.Red)
                .setTimestamp();

                await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
                return;
            }

            // Check that if we are given inline specifications, they map to each field (no missing / extras)
            if (rawInlines && (rawInlines.match(/;/g).length != rawValues.match(/;/g).length)) {
                let embed = new EmbedBuilder()
                .setTitle(`❌ Error`)
                .setDescription(`The amount of inline specifications does not match the amount of field titles and field descriptions specified. Please ensure that the amount of inline specifications is the same as both of these.`)
                .setColor(Colors.Red)
                .setTimestamp();

                await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
                return;
            }

            const iterations = (rawKeys)?rawKeys.match(/;/g).length:0;
            const specifiedInline = (rawInlines !== undefined);

            let embedFields = []
            for (let i = 0; i < iterations; i++) {
                let keyIndex = (rawKeys.indexOf(';') != -1) ? rawKeys.indexOf(';') : rawKeys.length;
                let valueIndex = (rawValues.indexOf(';') != -1) ? rawValues.indexOf(';') : rawValues.length;

                let keyContent = rawKeys.substring(0, keyIndex);
                let valueContent = rawValues.substring(0, valueIndex);

                embedFields[i] = {
                    name: keyContent,
                    value: valueContent,
                    inline: false,
                }

                rawKeys = rawKeys.substring(keyIndex + 1);
                rawValues = rawValues.substring(valueIndex + 1);

                if (specifiedInline) {
                    let inlineIndex = (rawInlines.indexOf(';') != -1) ? rawInlines.indexOf(';') : rawInlines.length;
                    let inlineContent = rawInlines.substring(0, inlineIndex);

                    embedFields[i].inline = (inlineContent.toLowerCase() == 'y' || inlineContent.toLowerCase() == 't');

                    rawInlines = rawInlines.substring(inlineIndex + 1);
                }
            }

            if (embedFields.length > 0 && rawKeys.indexOf(';') === -1) {
                embedFields[embedFields.length] = {
                    name: rawKeys,
                    value: rawValues,
                    inline: (specifiedInline)?(rawInlines.toLowerCase() == 'y' || rawInlines.toLowerCase() == 't'):false,
                }
            }

            let constructedEmbed = new EmbedBuilder()
            if (header) constructedEmbed.setTitle(header);
            if (description) constructedEmbed.setDescription(description);
            if (embedFields.length > 0) constructedEmbed.addFields(embedFields);
            if (color) constructedEmbed.setColor(color);
            if (image) constructedEmbed.setImage(image.url);
            if (thumbnail) constructedEmbed.setThumbnail(thumbnail.url);
            constructedEmbed.setTimestamp();

            await channel.send({content: message, embeds: [constructedEmbed]});

            let embed = new EmbedBuilder()
            .setTitle(`✅ Success`)
            .setDescription(`The embed was successfully sent to <#${channel.id}>.`)
            .setColor(Colors.Green)
            .setTimestamp();

            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
        } catch (e) {
            let embed = new EmbedBuilder()
            .setTitle(`❌ Error`)
            .setDescription(`An error occured while trying to generate the embed: ${e}`)
            .setColor(Colors.Red)
            .setTimestamp();
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral})
        }
    },

    reqs: {
        isDevOnly: true,
    },
}