const Student = require("../models/studentModel");
const unit = require("./unitController");
const messages = require("./messageController");

const student = {
	createFirst: async (username, password) => {
		try {
			const adminFound = await Student.find({ username: username });

			if (!(adminFound.length > 0)) {
				Student.register({ username: username }, password, (err, user) => {
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
	enrollUnit: async (studentId, unitId, enrollmentKey) => {
		try {
			const foundUnits = await Student.findById({
				_id: studentId,
			});

			if (!foundUnits.myUnits.includes(unitId)) {
				const theUnitProtected = await unit.isProtected(unitId);
				const theUnit = await unit.getUnit(unitId);

				if (theUnitProtected) {
					if (theUnitProtected === enrollmentKey) {
						const updatedStudent = await Student.findByIdAndUpdate(
							{ _id: studentId },
							{ $push: { myUnits: unitId } },
							{ new: true }
						);
						const addedMember = await unit.addMember(unitId, studentId);

						if (updatedStudent && addedMember) {
							const savedMessage = await messages.save(
								Student,
								`Enrolled into unit: ${theUnit.unitCode}, ${theUnit.unitName}, by: Lec ${theUnit.creatorName}`,
								studentId
							);
							return true;
						} else {
							throw new Error("Unit Not Added!");
						}
					} else {
						throw new Error("Wrong Enrollment Key!");
					}
				} else {
					const updatedStudent = await Student.findByIdAndUpdate(
						{ _id: studentId },
						{ $push: { myUnits: unitId } },
						{ new: true }
					);
					const addedMember = await unit.addMember(unitId, studentId);
					if (updatedStudent && addedMember) {
						const savedMessage = await messages.save(
							Student,
							`Enrolled into unit: ${theUnit.unitCode}, ${theUnit.unitName}, by: Lec ${theUnit.creatorName}`,
							studentId
						);
						return true;
					} else {
						throw new Error("Unit Not Added!");
					}
				}
			} else {
				return true;
			}
		} catch (error) {
			return { error: error.message };
		}
	},
	unenrollUnit: async (studentId, unitId) => {
		try {
			const updatedStudent = await Student.findByIdAndUpdate(
				studentId,
				{ $pull: { myUnits: unitId } },
				{ new: true }
			);
			const updatedUnits = await unit.removeMember(unitId, studentId);

			if (!updatedStudent) {
				return {
					error: "Student not found or already unenrolled from this unit.",
				};
			}
			await messages.save(Student, "Unenrolled From Unit !", studentId);
			return { success: true, updatedStudent };
		} catch (error) {
			return { error: error.message };
		}
	},

	getStudent: async (studentId) => {
		try {
			const foundStudent = await Student.findById({ _id: studentId });
			return foundStudent;
		} catch (error) {
			return { error: error.message };
		}
	},
	deleteStudent: async (studentId) => {
		try {
			const foundStudent = await Student.findByIdAndDelete(studentId);

			for (let index = 0; index < foundStudent.myUnits.length; index++) {
				const element = foundStudent.myUnits[index];
				const removedMember = await unit.removeMember(element, studentId);
			}

			return true;
		} catch (error) {
			return { error: error.message };
		}
	},
	markMessagesAsRead: async (studentId) => {
		try {
			const updatedStudent = await messages.markAsRead(Student, studentId);
			if (!updatedStudent.error) {
				return true;
			}
		} catch (error) {
			return { error: error.message };
		}
	},
	deleteMessages: async (studentId) => {
		try {
			const deletedMessages = await messages.deleteAll(Student, studentId);
			if (deletedMessages && !deletedMessages.error) {
				return true;
			}
			throw new Error(deletedMessages?.error || "Messages Not Deleted!");
		} catch (error) {
			return { error: error.message };
		}
	},
};

module.exports = student;
