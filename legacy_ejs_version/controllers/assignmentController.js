const Assignment = require("../models/assignmentModel");
const multer = require("multer");
const fs = require("fs");

// Assignments
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const lecturerId = req.user._id;
		const assignmentDir = "Assignments";
		const assignmentGivenDir = `${assignmentDir}/${lecturerId}`;
		if (!fs.existsSync(assignmentDir)) {
			fs.mkdirSync(assignmentDir);
		}
		if (!fs.existsSync(assignmentGivenDir)) {
			fs.mkdirSync(assignmentGivenDir);
		}
		cb(null, assignmentGivenDir);
	},
	filename: (req, file, cb) => {
		// Use the original name of the file
		const uniqueName = `${Date.now()}_${file.originalname}`;
		cb(null, uniqueName);
	},
});

const upload = multer({
	storage: storage,
	fileFilter: (req, file, cb) => {
		const validTypes = [
			"text/plain",
			"application/pdf",
			"application/msword",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		];
		if (validTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error("Invalid file type"), false);
		}
	},
});

const assignment = {
	save: async (
		title,
		description,
		filePath,
		creator,
		subject,
		unit,
		deadline
	) => {
		try {
			const newAssignment = new Assignment({
				title: title,
				description: description,
				filePath: filePath,
				createdBy: creator,
				subject: subject,
				unit: unit,
				deadline: deadline,
			});

			const saveStatus = await newAssignment.save();
			if (saveStatus) {
				return saveStatus;
			} else {
				throw new Error("Assignment Not Saved!");
			}
		} catch (error) {}
	},
	upload: upload,
};

module.exports = assignment;
