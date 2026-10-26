const Timetable = require("../models/timetableModel");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const mime = require("mime-types");

async function deleteFile(filePath) {
	return new Promise((resolve) => {
		fs.unlink(filePath, (err) => {
			if (err) {
				resolve(false);
			} else {
				resolve(true);
			}
		});
	});
}

const timetableStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		const timetableDir = "Timetable";
		if (!fs.existsSync(timetableDir)) {
			fs.mkdirSync(timetableDir);
		}

		cb(null, timetableDir);
	},
	filename: (req, file, cb) => {
		const originalExtension = path.extname(file.originalname); // Extract extension from original file
		const mimeExtension = mime.extension(file.mimetype); // Or get the extension from MIME type

		const extension = originalExtension || `.${mimeExtension}`; // Use original extension if present, fallback to MIME extension
		const uniqueName = `${Date.now()}_${path.basename(
			file.originalname,
			originalExtension
		)}${extension}`; // Preserve original name, append timestamp, and extension
		cb(null, uniqueName);
	},
});
const uploadTimetable = multer({
	storage: timetableStorage,
	fileFilter: (req, file, cb) => {
		const validTypes = [
			"text/plain",
			"application/pdf",
			"application/msword",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			"application/vnd.ms-excel", // For .xls files
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // For .xlsx files
		];
		if (validTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error("Invalid file type"), false);
		}
	},
});

const timetable = {
	uploadTimetable: uploadTimetable,
	list: async () => {
		try {
			const timetableList = await Timetable.find();
			return timetableList;
		} catch (error) {
			return { error: error.message };
		}
	},
	save: async (title, description, fileLocation, creator) => {
		try {
			const newTimetable = new Timetable({
				title: title,
				description: description,
				fileLocation: fileLocation,
				creator: creator,
			});
			const savedTimetable = await newTimetable.save();
			return true;
		} catch (error) {
			return { error: error.message };
		}
	},
	delete: async (timetableId) => {
		try {
			const deletedTimetable = await Timetable.findByIdAndDelete(timetableId);

			const deletedFile = await deleteFile(deletedTimetable.fileLocation);

			if (deletedTimetable && deletedFile) {
				return true;
			} else {
				throw new Error("Timetable Not Deleted!");
			}
		} catch (error) {
			return { error: error.message };
		}
	},
	getFile: async (timetableId) => {
		try {
			const foundTimetable = await Timetable.findById(timetableId);
			if (foundTimetable) {
				return foundTimetable.fileLocation;
			} else {
				throw new Error("File Not found");
			}
		} catch (error) {
			return { error: error.message };
		}
	},
};
module.exports = timetable;
