"use strict";

const { Schema, model } = require('mongoose');

const TicketMetadataSchema = new Schema({
    ticket_id: { // the ID of the channel where the ticket is located
        type: String,
        required: true,
    },

    ticket_owner: { // ticket creator's discord ID is stored here
        type: String,
        default: "",
    },

    claimant: { // discord ID of whoever claims the ticket (staff)
        type: String,
        default: "",
    }
});

module.exports = model('TicketMetadata', TicketMetadataSchema);