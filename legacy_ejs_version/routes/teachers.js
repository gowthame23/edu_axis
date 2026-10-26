const router = require("express").Router();
const Teacher = require("../models/teacherModel");
// const passportConfig = require("../passportConfig");
const Assignment = require("../models/assignmentModel");
// passportConfig(router);
const flash = require("connect-flash");
const { deleteFile } = require("../controllers/functions");
const teacher = require("../controllers/teachersController");
const thisGuy = require("../middleware/authentications");
// Route for handling teachers list

router.use(flash());
router
	// ? LIST OF TEACHERS PAGE
	.get("/teachersList", thisGuy.hasAccess, thisGuy.isAdmin, (req, res) => {
		try {
			res.render("teachersControl");
		} catch (error) {
			res.redirect("/login");
		}
	})
	// ? ADD NEW TEACHER
	.post(
		"/teachers/add",
		thisGuy.hasAccess,
		thisGuy.isAdmin,
		async (req, res) => {
			try {
				Teacher.register(
					{ username: req.body.username },
					req.body.password,
					async (err, user) => {
						if (err) {
							return res.status(400).json({ message: err.message || String(err) });
						}
						try {
							const lean = await Teacher.findById(user._id).lean();
							return res.status(201).json({ message: "Lecturer added", teacher: { _id: lean._id, username: lean.username, createdAt: lean.createdAt } });
						} catch (e) {
							return res.status(201).json({ message: "Lecturer added", teacher: { _id: user._id, username: user.username } });
						}
					}
				);
			} catch (e) {
				return res.status(500).json({ message: e.message || 'Error adding teacher' });
			}
		}
	)
	// ? CHANGE PASSWORD
	.post("/teachers/:id/password", thisGuy.hasAccess, thisGuy.isAdmin, async (req, res) => {
		try {
			const { password } = req.body;
			const theTeacher = await Teacher.findById(req.params.id);
			if (!theTeacher) {
				return res.status(404).json({ error: "Teacher not found" });
			}
			theTeacher.setPassword(password, async (err) => {
				if (err) {
					return res.status(500).json({ error: err.message });
				}
				await theTeacher.save();
				return res.status(200).json({ message: "Password updated successfully" });
			});
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	})
	// ? LIST ALL TEACHERS
	.get("/teachers", thisGuy.hasAccess, thisGuy.isAdmin, async (req, res) => {
		try {
			const teachers = await Teacher.find({});
			res.status(200).json(teachers);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	})
	// ? GET DETAILS OF A TEACHER
	.get(
		"/teachers/:id",
		thisGuy.hasAccess,
		thisGuy.isAdmin,
		async (req, res) => {
			try {
				const theTeacher = await Teacher.findById(req.params.id);
				if (!theTeacher) {
					return res.status(404).json({ error: "Teacher not found" });
				}
				res.status(200).json(theTeacher);
			} catch (err) {
				res.status(500).json({ error: err.message });
			}
		}
	)
	// ? DELETE A PARTICULAR TEACHER
	.post(
		"/teachers/delete/:id",
		thisGuy.hasAccess,
		thisGuy.isAdmin,
		async (req, res) => {
			try {
				const teacherUserName = await Teacher.find(
					{ _id: req.params.id },
					{ username: true, _id: false }
				);
				// Ensure you have the username by accessing the first element of the result array
				const theUserName =
					teacherUserName.length > 0 ? teacherUserName[0].username : null;

				if (theUserName) {
					const allAssignments = await Assignment.find(
						{
							createdBy: theUserName,
						},
						{ filePath: true, _id: true }
					);
					allAssignments.forEach(async (assignment, index) => {
						await deleteFile(assignment.filePath)
							.then(async () => {
								await Assignment.findByIdAndDelete(assignment._id);
								// console.log("File " + index + " Deleted");
							})
							.catch((error) => {
								console.error("Error deleting file " + index + ": ", error);
							});
					});

					// console.log(allAssignments);
				} else {
					req.flash("info", "No teacher found with the given ID");
				}

				const theTeacher = await Teacher.findByIdAndDelete(req.params.id);

				if (!theTeacher) {
					return res.status(404).json({ message: "Teacher not found" });
				} else {
					return res.status(200).json({ message: "Teacher deleted" });
				}
			} catch (err) {
				res.status(500).json({ error: err.message });
			}
		}
	)
	// ? UPDATE DETAILS OF A PARTICULAR TEACHER
	.post(
		"/teachers/update/:id",
		thisGuy.hasAccess,
		thisGuy.isAdmin,
		async (req, res) => {
			// console.log(req.body);
			try {
				const updates = req.body;
				const theTeacher = await Teacher.findByIdAndUpdate(
					req.params.id,
					updates,
					{
						new: true,
					}
				);
				if (!theTeacher) {
					return res.status(404).json({ error: "Teacher not found" });
				}
				res.status(200).json(theTeacher);
			} catch (err) {
				res.status(500).json({ error: err.message });
			}
		}
	)
	// ? ADD SUBJECT TO A TEACHER
	.post("/teachers/:id/subjects", thisGuy.hasAccess, async (req, res) => {
		const { id } = req.params;
		const { newSubject } = req.body;
		if (!newSubject) {
			return res.status(400).send("Subject is required");
		}
		try {
			const theTeacher = await Teacher.findByIdAndUpdate(
				id,
				{ $addToSet: { subjectsTaught: newSubject } },
				{ new: true }
			);
			if (!theTeacher) {
				return res.status(404).send("Teacher not found");
			}
			res.redirect("/dashboard");
		} catch (error) {
			if (error.kind === "ObjectId") {
				return res.status(400).send("Invalid teacher ID");
			}
			res.status(500).send(error.message);
		}
	})
	// ? REMOVE SUBJECT FROM TEACHER
	.post("/teacher/:id/delete/subjects", thisGuy.hasAccess, async (req, res) => {
		const { id } = req.params;
		const { subjectToDelete } = req.body;

		if (!subjectToDelete) {
			return res.status(400).send("Subject is required");
		}

		try {
			const theTeacher = await Teacher.findByIdAndUpdate(
				id,
				{
					$pull: { subjectsTaught: subjectToDelete },
				},
				{ new: true }
			);
			if (!theTeacher) {
				return res.status(404).send("Teacher not found");
			}
			res.redirect("/dashboard");
		} catch (error) {
			if (error.kind === "ObjectId") {
				return res.status(400).send("Invalid teacher ID");
			}
			res.status(500).send(error.message);
		}
	})
	// ? MARK MESSAGES AS READ
	.post(
		"/teachers/messages/markasread/:id",
		thisGuy.hasAccess,
		async (req, res) => {
			try {
				const { id } = req.params;
				const updatedTeacher = await teacher.markMessagesAsRead(id);
				if (!updatedTeacher.error) {
					return res.status(200).json({ success: true, message: "Messages marked as read" });
				}
				return res.status(400).json({ success: false, message: updatedTeacher.error });
			} catch (e) {
				return res.status(500).json({ success: false, message: e.message });
			}
		}
	)
	// ? DELETE ALL MESSAGES
	.post(
		"/teachers/messages/delete/:id",
		thisGuy.hasAccess,
		async (req, res) => {
			try {
				const { id } = req.params;
				const { messageId } = req.body || {};
				if (messageId) {
					const result = await require('../controllers/messageController').deleteOne(require('../models/teacherModel'), id, messageId);
					if (!result.error) return res.status(200).json({ success: true, message: 'Message deleted' });
					return res.status(400).json({ success: false, message: result.error });
				}
				const deletedTeacherMessage = await teacher.deleteMessages(id);
				if (!deletedTeacherMessage.error) {
					return res.status(200).json({ success: true, message: "All messages deleted" });
				}
				return res.status(400).json({ success: false, message: deletedTeacherMessage.error });
			} catch (e) {
				return res.status(500).json({ success: false, message: e.message });
			}
		}
	);

module.exports = router;
