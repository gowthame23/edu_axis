const { $where } = require("../models/studentModel");
const Unit = require("../models/unitModel");
const teacher = require("./teachersController");
const Assignment = require("../models/assignmentModel");
const Teacher = require("../models/teacherModel");
const messages = require("./messageController");
const Student = require("../models/studentModel");

const unit = {
	save: async (unitName, unitCode, enrollmentKey, creator) => {
		try {
			enrollmentKey = enrollmentKey === "" ? undefined : enrollmentKey;
			const creatorName = await teacher.getName(creator);

			const newUnit = new Unit({
				unitName: unitName,
				unitCode: unitCode,
				enrollmentKey: enrollmentKey,
				creator: creator,
				creatorName: creatorName,
			});
			const savedTeacherMessage = await messages.save(
				Teacher,
				`Added New Unit: ${unitName}`,
				creator
			);
			const savedUnit = await newUnit.save();
			if (savedUnit) {
				if (!savedUnit.error) {
					return true;
				} else {
					throw new Error(savedUnit.error);
				}
			} else {
				throw new Error("Unit Not Saved!");
			}
		} catch (error) {
			return { error: error.message };
		}
	},
	deleteUnit: async (unitId) => {
		try {
			const deletedUnit = await Unit.findByIdAndDelete({ _id: unitId });
			const { members } = deletedUnit;

			for (let index = 0; index < members.length; index++) {
				const member = members[index];
				const updatedStudent = await Student.findByIdAndUpdate(
					member,
					{ $pull: { myUnits: unitId } },
					{ new: true }
				);
			}

			if (deletedUnit) {
				return true;
			} else {
				throw new Error("Unit Not Deleted!");
			}
		} catch (error) {
			return { error: error.message };
		}
	},
	addMember: async (unitId, studentId) => {
		try {
			const foundUnit = await Unit.findById(unitId);
			const { members } = foundUnit;
			if (!members.includes(studentId)) {
				const updatedUnit = await Unit.findByIdAndUpdate(
					{ _id: unitId },
					{ $push: { members: studentId } }
				);
				if (updatedUnit) {
					return true;
				} else {
					throw new Error("Member Not Added!");
				}
			}
			return true;
		} catch (error) {
			return { error: error.message };
		}
	},
	removeMember: async (unitId, studentId) => {
		try {
			const updatedUnit = await Unit.findByIdAndUpdate(
				{ _id: unitId },
				{ $pull: { members: studentId } },
				{ new: true }
			);
			if (updatedUnit) {
				return true;
			} else {
				throw new Error("Member Not Removed");
			}
		} catch (error) {
			return { error: error.message };
		}
	},
	getUnitData: async (unitsArray) => {
		try {
			let theUnits = [];
			for (let index = 0; index < unitsArray.length; index++) {
				const element = unitsArray[index];
				let theUnit = await Unit.findById({ _id: element });
				theUnits.push(theUnit);
			}

			return theUnits;
		} catch (error) {
			return { error: error.message };
		}
	},
	getMyUnitData: async (teacherId) => {
		try {
			const unitsGotten = await Unit.find({ creator: teacherId });
			if (unitsGotten) {
				return unitsGotten;
			} else {
				throw new Error("Units Not Found!");
			}
		} catch (error) {
			return { error: error.message };
		}
	},
	getSearch: async (searchValue) => {
		try {
			let theRealResults = [];
			let results = await Unit.find({});

			for (let index = 0; index < results.length; index++) {
				let element = results[index];
				if (
					element.unitName.toLowerCase().includes(searchValue.toLowerCase()) ||
					element.unitCode.toLowerCase().includes(searchValue.toLowerCase()) ||
					element.creatorName.toLowerCase().includes(searchValue.toLowerCase)
				) {
					theRealResults.push(element);
				}
			}

			return theRealResults;
		} catch (error) {
			return { error: error.message };
		}
	},
	isProtected: async (unitId) => {
		try {
			const foundUnit = await Unit.findById(
				{ _id: unitId },
				{ enrollmentKey: true }
			);
			return foundUnit.enrollmentKey;
		} catch (error) {
			return { error: error.message };
		}
	},
	getUnit: async (unitId) => {
		try {
			const foundUnit = await Unit.findById({ _id: unitId });
			if (foundUnit) {
				return foundUnit;
			} else {
				throw new Error("Unit Not Found");
			}
		} catch (error) {
			return { error: error.message };
		}
	},
	assignment: {
		save: async (assignmentId, unitId) => {
			try {
				const saveStatus = await Unit.findByIdAndUpdate(
					{ _id: unitId },
					{ $push: { assignments: assignmentId } }
				);
			} catch (error) {
				return { error: error.message };
			}
		},
		get: async (myUnits, thisUnit) => {
			try {
				let accummulator = [];

				for (let index = 0; index < myUnits.length; index++) {
					const element = myUnits[index];
					const foundUnit = await Unit.findById(
						{ _id: element },
						{ assignments: true }
					);
					for (let index = 0; index < foundUnit.assignments.length; index++) {
						const element = foundUnit.assignments[index];
						const foundAssignment = await Assignment.findById({
							_id: element._id,
							unit: thisUnit,
						});
						accummulator.push(foundAssignment);
					}
				}
				// myUnits.forEach(async (thisUnit) => {

				// });
				return accummulator;
			} catch (error) {
				return { error: error.message };
			}
		},
		remove: async (assignmentId) => {
			try {
				const assignment = await Assignment.findByIdAndDelete({ _id: assignmentId });

				if (!assignment) {
					return { error: "Assignment not found." };
				}

				let updatedUnit = null;
				if (assignment.unit) {
					updatedUnit = await Unit.findByIdAndUpdate(
						{ _id: assignment.unit },
						{ $pull: { assignments: assignmentId } },
						{ new: true }
					);
				}

				if (assignment.unit && !updatedUnit) {
					throw new Error("Unit not found or assignment not associated with this unit.");
				}

				return { message: "Assignment removed successfully." };
			} catch (error) {
				// Handle and return error
				return { error: `Error removing assignment: ${error.message}` };
			}
		},
	},
	announcement: {
		save: async (announcementTitle, announcementDetails, unitId) => {
			try {
				const newAnnouncement = {
					announcementTitle: announcementTitle,
					announcementDetails: announcementDetails,
				};

				const updatedUnit = await Unit.findByIdAndUpdate(
					{ _id: unitId },
					{ $push: { announcements: newAnnouncement } }
				);
				if (updatedUnit) {
					return true;
				} else {
					throw new Error("Announcement Not Saved!");
				}
			} catch (error) {
				return { error: error.message };
			}
		},
		delete: async (announcementId, unitId) => {
			try {
				const removedAnnouncement = await Unit.findById({
					_id: unitId,
				});

				let updatedAnnouncements = [];
				for (
					let index = 0;
					index < removedAnnouncement.announcements.length;
					index++
				) {
					const element = removedAnnouncement.announcements[index];
					if (!(element.id === announcementId)) {
						updatedAnnouncements.push(element);
					}
				}

				const theRealUpdatedAnnouncements = await Unit.findByIdAndUpdate(
					{
						_id: unitId,
					},
					{
						$set: {
							announcements: updatedAnnouncements,
						},
					}
				);

				if (theRealUpdatedAnnouncements) {
					return true;
				} else {
					throw new Error("Announcement Not Updated!");
				}
			} catch (error) {
				return { error: error.message };
			}
		},
	},
};
module.exports = unit;
