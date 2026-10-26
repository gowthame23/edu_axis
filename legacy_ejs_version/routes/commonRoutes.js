const router = require("express").Router();
const Class = require("../models/classModel");
const Admin = require("../models/adminModel");
const Teacher = require("../models/teacherModel");
const Student = require("../models/studentModel");
const Assignment = require("../models/assignmentModel");
const passport = require("passport");
const Event = require("../models/events");
const flash = require("connect-flash");
const unit = require("../controllers/unitController");
const timetable = require("../controllers/timetableController");
const fees = require("../controllers/feesController");
const thisGuy = require("../middleware/authentications");
const dashboardRoute = require("./dashboardRoute");

router.use(flash());
router.use("/", dashboardRoute);

const {
	Numbers,
	countMembers,
	formatDate,
	deadlineReached,
} = require("../controllers/functions");

// const passportConfig = require("../passportConfig");
const deferment = require("../controllers/defermentController");

// passportConfig(router);

// COMMON ROUTES
router
	.get("/", (req, res) => {
		res.render("home");
	})
	.get("/login", (req, res) => {
		const messages = req.session ? req.flash() : {};
		res.render("login", { messages });
	})
	.get("/register", (req, res) => {
		const messages = req.session ? req.flash() : {};
		res.render("register", { messages });
	})
	.post("/units", thisGuy.hasAccess, async (req, res) => {
		try {
			const { unitId } = req.body;
			const dashType = await req.session.passport.user.type;
			const userId = req.session.passport.user.id;
			let user;
			const classes = await Class.find({}).sort({ className: 1 });
			const thisUnitData = await unit.getUnit(unitId);

			const commonData = {
				userName: req.user.username,
				userId: req.user._id,
				userType: dashType,
				formatDate: formatDate,
				deadlineReached: deadlineReached,
				Unit: thisUnitData,
				messages: req.flash("info"),
			};
			const fetchStudentData = async () => {
				const studentClass = await Student.findById(userId);
				const classAssignments = await Assignment.find({
					AsClass: studentClass.class,
				});
				user = await Student.findById(userId);
				const assignments = await Assignment.find({ unit: unitId }, {}).sort({ createdAt: -1 });
				return {
					studentClass: studentClass.class,
					classAssignments: classAssignments,
					user: user,
					assignments: assignments,
				};
			};
			const fetchTeacherData = async () => {
				const teacherAssignments = await Assignment.find(
					{ createdBy: req.user.username, unit: unitId },
					{}
				).sort({ createdAt: -1 });
				user = await Teacher.findById(userId);
				return {
					assignments: teacherAssignments,
					user: user,
					classes: classes,
				};
			};
			let dashboardData = {};
			switch (dashType) {
				case "Student":
					dashboardData = await fetchStudentData();
					res.render("unitView", { ...commonData, ...dashboardData });
					break;
				case "Teacher":
					dashboardData = await fetchTeacherData();
					res.render("unitPanel", { ...commonData, ...dashboardData });
					break;
				default:
					res.status(403).send("You do not have access to this page");
					break;
			}
		} catch (error) {
			console.error("Error accessing the dashboard:", error);
			res.status(500).send("Internal Server Error");
		}
	})
	.get("/units", thisGuy.hasAccess, async (req, res) => {
		try {
			const unitId = req.flash("origin")[0];
			const dashType = await req.session.passport.user.type;
			const userId = req.session.passport.user.id;
			let user;
			const classes = await Class.find({}).sort({ className: 1 });
			const thisUnitData = await unit.getUnit(unitId);
			const commonData = {
				userName: req.user.username,
				userId: req.user._id,
				userType: dashType,
				formatDate: formatDate,
				Unit: thisUnitData,
				messages: req.flash("info"),
			};
			const fetchStudentData = async () => {
				const studentClass = await Student.findById(userId);
				const classAssignments = await Assignment.find({
					AsClass: studentClass.class,
				});
				user = await Student.findById(userId);
				const unitData = await unit.getUnitData(user.myUnits);
				return {
					studentClass: studentClass.class,
					classAssignments: classAssignments,
					classes: classes,
					user: user,
					unitData: unitData,
				};
			};
			const fetchTeacherData = async () => {
				const teacherAssignments = await Assignment.find(
					{ createdBy: req.user.username, unit: unitId },
					{}
				);
				user = await Teacher.findById(userId);
				return {
					assignments: teacherAssignments,
					user: user,
					classes: classes,
				};
			};
			let dashboardData = {};
			switch (dashType) {
				case "Student":
					dashboardData = await fetchStudentData();
					res.render("unitView", { ...commonData, ...dashboardData });
					break;
				case "Teacher":
					dashboardData = await fetchTeacherData();
					res.render("unitPanel", { ...commonData, ...dashboardData });
					break;
				default:
					res.status(403).send("You do not have access to this page");
					break;
			}
		} catch (error) {
			console.error("Error accessing the dashboard:", error);
			res.status(500).send("Internal Server Error");
		}
	})
	.get("/logout", (req, res, next) => {
		// Use passport's logout to clear the login session correctly
		req.logout((err) => {
			if (err) return next(err);
			// Redirect to login; client-side will show any farewell toast before calling this
			return res.redirect('/login');
		});
	})
	.post("/register", thisGuy.register)
	.post("/login", thisGuy.login);

module.exports = router;
