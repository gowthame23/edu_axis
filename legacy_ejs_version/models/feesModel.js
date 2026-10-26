const mongoose = require("mongoose");
const feesStructureSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
		},
		fileLocation: {
			type: String,
			required: true,
			unique: true,
		},
		creator: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: true,
	}
);
const FeesStructure = new mongoose.model("FeesStructure", feesStructureSchema);
module.exports = FeesStructure;
