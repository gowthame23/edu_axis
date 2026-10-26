require("ejs");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const app = express();

const admin = require("./controllers/adminController");
const teacher = require("./controllers/teachersController");
const student = require("./controllers/studentController");
const storage = require("./controllers/storageControllers");

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
require("dotenv").config();
const port = process.env.PORT || 3000;
// CREATING SESSION
app.use( 	
	session({
		name: "ea.sid",
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
		rolling: true, // refresh cookie expiration on every response
		cookie: {
			// Extend session lifetime to 7 days
			maxAge: 7 * 24 * 60 * 60 * 1000,
			sameSite: "lax",
			// secure: true, // enable when serving over HTTPS
		},
		store: MongoStore.create({
			mongoUrl: process.env.MONGODB_URI,
			collectionName: 'sessions',
			ttl: 7 * 24 * 60 * 60, // 7 days in seconds
			touchAfter: 24 * 3600 // only update session once per day if unmodified
		})
	})
);

const passportConfig = require("./passportConfig");

passportConfig(app);

// DATABASE CONNECTION
mongoose.connect(process.env.MONGODB_URI);

// IMPORTING ROUTES
const eventsRoutes = require("./routes/events");
const teachersRoutes = require("./routes/teachers");
const assignmentRoutes = require("./routes/assignmentRoute");
const classRoutes = require("./routes/classRoutes");
const studentRoutes = require("./routes/studentRoutes");
const commonRoutes = require("./routes/commonRoutes");
const unitRoutes = require("./routes/unitRoute");
const timetableRouters = require("./routes/timetableRoutes");
const feesStructureRouters = require("./routes/feesRoutes");
const defermentRoutes = require("./routes/defermentRoute");
const submissionRoutes = require("./routes/submissionRoutes");

app.use("/", teachersRoutes);
app.use("/", eventsRoutes);
app.use("/", submissionRoutes);
app.use("/", assignmentRoutes);
app.use("/", classRoutes);
app.use("/", studentRoutes);
app.use("/", commonRoutes);
app.use("/unit", unitRoutes);
app.use("/timetable", timetableRouters);
app.use("/fees", feesStructureRouters);
app.use("/deferment", defermentRoutes);

// Ensure error handling middleware is set up
app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).send(`Something went wrong!<br/>: Error: ${err}`);
});

async function firstUsers() {
	await Promise.all([
		admin.createFirst(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD),
		teacher.createFirst(
			process.env.TEACHER_USERNAME,
			process.env.TEACHER_PASSWORD
		),
		student.createFirst(
			process.env.STUDENT_USERNAME,
			process.env.STUDENT_PASSWORD
		),
	]);
	return true;
}

async function createAssignments() {
	return await storage.createAssignments();
}

app.get("/payment-portal", (req, res) => {
	console.log("Payment portal accessed");
	res.render("payment-portal");
});	

app.listen(port, async () => {
	const creations = await Promise.all([
		firstUsers(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD),
		createAssignments(),
	]);

	console.log(`Server is live on port ${port}`);
});
