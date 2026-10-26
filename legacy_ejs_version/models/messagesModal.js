const mongoose = require("mongoose");
const messagesSchema = new mongoose.Schema(
	{
		title: {
			type: String,
		},
		read: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	}
);

module.exports = messagesSchema;
