const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const passport = require("passport");

const adminSchema = new mongoose.Schema(
	{
		username: {//email as user name
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		password: {
			type: String,
		},

		secret: {
			type: String,
		},
	},
	{
		timestamps: true,
	}
);

adminSchema.plugin(passportLocalMongoose);
const Admin = new mongoose.model("Admin", adminSchema);
passport.use("admin-local", Admin.createStrategy());

module.exports = Admin;
