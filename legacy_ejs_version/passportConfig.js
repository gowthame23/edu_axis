const passport = require("passport");
const Student = require("./models/studentModel");
const Admin = require("./models/adminModel");
const Teacher = require("./models/teacherModel");

module.exports = (app) => {
	// Passport Configuration

	app.use(passport.initialize());
	app.use(passport.session());

	// SERIALIZE AND DESERIALIZE
	passport.serializeUser((user, done) => {
		let userType = "Student";
		if (user instanceof Admin) {
			userType = "Admin";
		} else if (user instanceof Teacher) {
			userType = "Teacher";
		}
		done(null, {
			id: user.id,
			type: userType,
		});
	});

	passport.deserializeUser(async (obj, done) => {
		try {
			let user;
			if (obj.type === "Admin") {
				user = await Admin.findById(obj.id);
			} else if (obj.type === "Teacher") {
				user = await Teacher.findById(obj.id);
			} else {
				user = await Student.findById(obj.id);
			}
			done(null, user);
		} catch (err) {
			done(err, null);
		}
	});
};
