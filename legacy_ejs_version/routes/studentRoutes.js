const router = require("express").Router();
const flash = require("connect-flash");
const Student = require("../models/studentModel");
const student = require("../controllers/studentController");
const thisGuy = require("../middleware/authentications");

router.use(flash());

router
	.post("/students/add", thisGuy.hasAccess, async (req, res) => {
		try {
			Student.register(
				{ username: req.body.username },
				req.body.password,
				async (err, user) => {
					if (err) {
						return res.status(400).json({ message: err.message || String(err) });
					}
					try {
						const lean = await Student.findById(user._id).lean();
						return res.status(201).json({ message: "Student added", student: { _id: lean._id, username: lean.username, createdAt: lean.createdAt } });
					} catch (e) {
						return res.status(201).json({ message: "Student added", student: { _id: user._id, username: user.username } });
					}
				}
			);
		} catch (e) {
			return res.status(500).json({ message: e.message || 'Error adding student' });
		}
	})
	.post("/students/:id/class", thisGuy.hasAccess, async (req, res) => {
		const studentId = req.params.id;
		const newClass = await req.body.newClass;
		try {
			const theStudent = await Student.findByIdAndUpdate(
				studentId,
				{ class: newClass },
				{ new: true }
			);
			if (!theStudent) {
				return res.status(404).json({ message: "Student not found" });
			} else if (theStudent.class === newClass) {
				res.redirect("/dashboard");
			} else {
				throw Error("Class not updated");
			}
		} catch (err) {
			res.status(500).json({ message: err.message });
		}
	})
	.post("/students/addunit", thisGuy.hasAccess, async (req, res) => {
		let { unitId, enrollmentKey } = req.body;

		const addedUnit = await student.enrollUnit(
			req.user._id,
			unitId,
			enrollmentKey
		);

		if (!addedUnit.error) {
			req.flash("info", "Unit Added Successfully!");
		} else {
			req.flash("info", addedUnit.error);
		}
		res.redirect("/dashboard");
	})
	.post("/students/removeunit", thisGuy.hasAccess, async (req, res) => {
		const { unitId } = req.body;
		try {
			const result = await student.unenrollUnit(req.user._id, unitId);
			if (result.error) {
				// Send JSON error response with status code 400
				return res.status(400).json({ success: false, error: result.error });
			}

			// Send JSON success response
			return res
				.status(200)
				.json({ success: true, message: "Unit removed successfully." });
		} catch (error) {
			return res.status(500).json({
				success: false,
				error: `Error removing unit: ${error.message}`,
			});
		}
	})
	.post("/students/delete/:id", thisGuy.hasAccess, async (req, res) => {
		const { id } = req.params;
		const deletedStudent = await student.deleteStudent(id);
		if (!deletedStudent.error) {
			return res.status(200).json({ message: "Student deleted" });
		} else {
			return res.status(400).json({ message: deletedStudent.error });
		}
	})
	.post(
		"/students/messages/markasread/:id",
		thisGuy.hasAccess,
		async (req, res) => {
			try {
				const { id } = req.params;
				const updatedStudent = await student.markMessagesAsRead(id);
				if (!updatedStudent.error) {
					return res.status(200).json({ success: true, message: "Messages marked as read" });
				}
				return res.status(400).json({ success: false, message: updatedStudent.error });
			} catch (e) {
				return res.status(500).json({ success: false, message: e.message });
			}
		}
	)
	.post(
		"/students/messages/delete/:id",
		thisGuy.hasAccess,
		async (req, res) => {
			try {
				const { id } = req.params;
				const { messageId } = req.body || {};
				if (messageId) {
					const result = await require('../controllers/messageController').deleteOne(require('../models/studentModel'), id, messageId);
					if (!result.error) return res.status(200).json({ success: true, message: 'Message deleted' });
					return res.status(400).json({ success: false, message: result.error });
				}
				const deletedStudent = await student.deleteMessages(id);
				if (!deletedStudent.error) {
					return res.status(200).json({ success: true, message: "All messages deleted" });
				}
				return res.status(400).json({ success: false, message: deletedStudent.error });
			} catch (e) {
				return res.status(500).json({ success: false, message: e.message });
			}
		}
	)
	.post("/students/:id/password", thisGuy.hasAccess, thisGuy.isAdmin, async (req, res) => {
		try {
			const { password } = req.body;
			const theStudent = await Student.findById(req.params.id);
			if (!theStudent) {
				return res.status(404).json({ error: "Student not found" });
			}
				theStudent.setPassword(password, async (err) => {
				if (err) {
					return res.status(500).json({ error: err.message });
				}
				await theStudent.save();
				return res.status(200).json({ message: "Password updated successfully" });
			});
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	});

module.exports = router;
