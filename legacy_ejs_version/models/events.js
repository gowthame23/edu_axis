const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
	author: {
		type: String,
		required: true,
	},
	published: {
		type: String,
		required: true,
	},
	title: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: true,
	},
	eventDate: {
		type: Date,
		required: true,
	},
});

module.exports = mongoose.model("Event", eventSchema);
