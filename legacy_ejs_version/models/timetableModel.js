const mongoose = require("mongoose");
const timetableSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: false,
		},
		fileLocation: {
			type: String,
			required: true,
		},
		creator: {
			type: String,
		},
	},
	{
		timestamps: true,
	}
);
const Timetable = new mongoose.model("Timetable", timetableSchema);
module.exports = Timetable;
