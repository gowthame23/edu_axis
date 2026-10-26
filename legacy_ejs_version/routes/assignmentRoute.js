const express = require("express");
const router = express.Router();
const Assignment = require("../models/assignmentModel");
const unit = require("../controllers/unitController");
const assignment = require("../controllers/assignmentController");
const flash = require("connect-flash");
const thisGuy = require("../middleware/authentications");
const path = require("path");
const messages = require("../controllers/messageController");
const Student = require("../models/studentModel");
const { combineDateTime } = require("../controllers/functions");
const { deleteFile } = require("../controllers/fileController");

router.use(flash());

// Handle file upload and save metadata to MongoDB
router
	.post(
		"/upload",
		thisGuy.hasAccess,
		thisGuy.isTeacher,
		assignment.upload.single("file"),
		async (req, res) => {
			try {
				const { description, subject, deadlineDate, deadlineTime } = JSON.parse(
					req.body.more
				);
				const { unitId } = req.body;
				const filePath = req.file.path;
				const creator = req.user.username;
				const goodTitle = req.file.originalname.split(".");
				const deadline = combineDateTime(deadlineDate, deadlineTime);
				const saveStatus = await assignment.save(
					goodTitle[0],
					description,
					filePath,
					creator,
					subject,
					unitId,
					deadline
				);
				const savedToUnit = await unit.assignment.save(saveStatus._id, unitId);

				// Notify all students in the unit about the new assignment (simple message)
				try {
					const theUnit = await unit.getUnit(unitId);
					if (theUnit && theUnit.members && theUnit.members.length) {
						await Promise.all(
							theUnit.members.map((studentId) =>
								messages.save(
									Student,
									`New assignment uploaded: ${goodTitle[0]}`,
									studentId
								)
							)
						);
					}
				} catch (notifyErr) {
					console.warn("Notification error:", notifyErr?.message || notifyErr);
				}
				res.status(201).json({
					message: "File uploaded and saved successfully",
					assignment: saveStatus,
				});
				// res.redirect("/assignments");
			} catch (error) {
				res
					.status(500)
					.json({ message: "Error uploading file", error: error.message });
			}
		}
	)
	// 3. Delete assignment by ID
	.post(
		"/assignments/delete/:id",
		thisGuy.hasAccess,
		thisGuy.isTeacher,
		async (req, res) => {
			try {
				const deleteStatus = await deleteFile(req.body.filePath);
				// Check if deleteStatus is false and throw an error
				if (!deleteStatus) {
					throw new Error("File deletion failed");
				}
				const removedFromUnit = await unit.assignment.remove(req.params.id);
				if (!removedFromUnit.error) {
					// return res.status(404).json({ message: "Cannot find assignment" });
					req.flash("info", removedFromUnit.message);
				} else {
					req.flash("info", removedFromUnit.error);
				}
				res.redirect(`/dashboard`);
			} catch (err) {
				req.flash("info", err.message);
				res.redirect("/dashboard");
				// res.status(500).json({ message: err.message });
			}
		}
	)
	.post(
		"/units/assignments/delete/:id/:unitId",
		thisGuy.hasAccess,
		thisGuy.isTeacher,
		async (req, res) => {
			try {
				// Check if deleteStatus is false and throw an error
				const removedFromUnit = await unit.assignment.remove(
					req.params.id,
					req.params.unitId
				);
				const deleteStatus = await deleteFile(req.body.filePath);
				if (!deleteStatus) {
					throw new Error("File deletion failed");
				}
				if (!removedFromUnit.error) {
					// Send a success message in JSON format
					res.json({
						success: true,
						message: "Successfully Deleted Assignment",
					});
				} else {
					// Send the error message in JSON format
					res.json({ success: false, message: removedFromUnit.message });
				}
			} catch (err) {
				// Send the error message in JSON format
				res.status(500).json({ success: false, message: err.message });
			}
		}
	)
	// 5. Downloading assignments
	.get("/assignments/download/:id", thisGuy.hasAccess, async (req, res) => {
		try {
			const assignment = await Assignment.findById(req.params.id);
			if (!assignment) {
				return res.status(404).json({ error: "Assignment not found" });
			}
			const filePath = path.resolve(assignment.filePath);
			res.download(filePath, (err) => {
				if (err) {
					console.error("Error downloading file", err);
					return res.status(500).json({ error: "Error downloading file" });
				}
			});
		} catch (err) {
			console.error("Error fetching assignment", err);
			res.status(500).json({ error: "Server error" });
		}
	});

module.exports = router;
