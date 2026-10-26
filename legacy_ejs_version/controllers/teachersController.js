const Teacher = require("../models/teacherModel");
const messages = require("./messageController");
const teacher = {
	createFirst: async (username, password) => {
		try {
			const adminFound = await Teacher.find({ username: username });

			if (!(adminFound.length > 0)) {
				Teacher.register({ username: username }, password, (err, user) => {
					if (err) {
						throw new Error(err.message);
					} else {
						return true;
					}
				});
			} else {
				return true;
			}
		} catch (error) {
			return { error: error.message };
		}
	},
	getName: async (teacherId) => {
		try {
			const foundTeacher = await Teacher.findById(
				{ _id: teacherId },
				{ username: true }
			);

			return foundTeacher.username;
		} catch (error) {
			return "Lecturer Not Available";
		}
	},
	markMessagesAsRead: async (teacherId) => {
		try {
			const updatedTeacher = await messages.markAsRead(Teacher, teacherId);
			if (!updatedTeacher.error) {
				return true;
			}
		} catch (error) {
			return { error: error.message };
		}
	},
	deleteMessages: async (teacherId) => {
		try {
			const deletedMessages = await messages.deleteAll(Teacher, teacherId);
			if (deletedMessages && !deletedMessages.error) {
				return true;
			}
			throw new Error(deletedMessages?.error || "Messages Not Deleted!");
		} catch (error) {
			return { error: error.message };
		}
	},
};

module.exports = teacher;
