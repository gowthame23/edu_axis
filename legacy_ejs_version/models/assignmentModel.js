const mongoose = require("mongoose");
const Unit = require("./unitModel");

const assignmentSchema = new mongoose.Schema(
	{
		title: { type: String, required: true },
		description: { type: String },
		filePath: { type: String, required: true, unique: true },
		createdBy: {
			type: String,

			required: true,
		},
		unit: { type: mongoose.Schema.ObjectId, required: false, ref: Unit },

		subject: { type: String, required: true },
		AsClass: { type: String, required: false },
		deadline: { type: Date, required: false },
	},
	{
		timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
	}
);

const Assignment = mongoose.model("Assignment", assignmentSchema);

module.exports = Assignment;
