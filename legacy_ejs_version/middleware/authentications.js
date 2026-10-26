const Admin = require("../models/adminModel");
const Teacher = require("../models/teacherModel");
const Student = require("../models/studentModel");
const passport = require("passport");

const { countMembers } = require("../controllers/functions");
const thisGuy = {
	hasAccess: async (req, res, next) => {
		if (req.isAuthenticated()) {
			next();
		} else {
				if (req.session) req.flash("error", "Please log in to access this page");
			res.redirect("/login");
		}
	},
	isStudent: async (req, res, next) => {
		if (req.session && req.session.passport && req.session.passport.user && req.session.passport.user.type === "Student") {
			next();
		} else {
			if (req.session) req.flash("error", "Access denied. Student privileges required.");
			res.redirect("/dashboard");
		}
	},
	isAdmin: async (req, res, next) => {
			if (req.session && req.session.passport && req.session.passport.user && req.session.passport.user.type === "Admin") {
			next();
		} else {
				if (req.session) req.flash("error", "Access denied. Administrator privileges required.");
			res.redirect("/dashboard");
		}
	},
	isTeacher: async (req, res, next) => {
			if (req.session && req.session.passport && req.session.passport.user && req.session.passport.user.type === "Teacher") {
			next();
		} else {
				if (req.session) req.flash("error", "Access denied. Teacher privileges required.");
			res.redirect("/dashboard");
		}
	},
	register: async (req, res, next) => {
		const userType = req.body.userType; // Assuming userType is passed in the request body
		let UserModel;
		if (userType === "Admin") {
			UserModel = Admin;
		} else if (userType === "Teacher") {
			UserModel = Teacher;
		} else if (userType === "Student") {
			UserModel = Student;
		} else {
			req.flash("info", "Invalid user type.");
			res.redirect("/register");
		}
		UserModel.register(
			{ username: req.body.username },
			req.body.password,
			(err, user) => {
				if (err) {
					req.flash("info", err.message);
					res.redirect("/register");
				} else {
					passport.authenticate(`${userType.toLowerCase()}-local`)(
						req,
						res,
						() => {
							res.redirect("/dashboard");
						}
					);
				}
			}
		);
		await countMembers();
	},
	login: async (req, res, next) => {
		const userType = req.body.userType; // Assuming userType is passed in the request body
		let UserModel;
		if (userType === "Admin") {
			UserModel = Admin;
		} else if (userType === "Teacher") {
			UserModel = Teacher;
		} else if (userType === "Student") {
			UserModel = Student;
		} else {
			req.flash("error", "Invalid user type selected");
			return res.redirect("/login");
		}
		const user = new UserModel({
			username: req.body.username,
			password: req.body.password,
		});

		req.login(user, (err) => {
			if (err) {
				console.log(err);
				req.flash("error", "Login failed: " + err.message);
				res.redirect("/login");
			} else {
				passport.authenticate(`${userType.toLowerCase()}-local`, {
					failureRedirect: '/login',
					failureFlash: 'Invalid username or password'
				})(req, res, () => {
					req.flash("success", "Welcome back, " + user.username + "!");
					res.render('login', { messages: req.flash() });
				});
			}
		});
	},
};
module.exports = thisGuy;
