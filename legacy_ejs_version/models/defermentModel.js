const mongoose = require("mongoose");
const defermentSchema = new mongoose.Schema(
	{
		studentName: {
			type: String,
			required: true,
		},
		studentNumber: {
			type: String,
			required: false,
		},
		reason: {
			type: String,
			required: true,
		},
		approved: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	}
);
const Deferment = new mongoose.model("Deferment", defermentSchema);
module.exports = Deferment;
