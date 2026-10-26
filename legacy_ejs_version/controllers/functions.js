const Student = require("../models/studentModel");
const Teacher = require("../models/teacherModel");
const Class = require("../models/classModel");
const Assignment = require("../models/assignmentModel");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

async function deleteFile(filePath) {
	return new Promise((resolve) => {
		fs.unlink(filePath, (err) => {
			if (err) {
				console.error("Error removing file:", err);
				resolve(false);
			} else {
				console.log("File removed successfully");
				resolve(true);
			}
		});
	});
}

async function Numbers() {
	const studentsList = await Student.find({});
	const studentNumbers = studentsList.length;

	const teachersList = await Teacher.find({});
	const teachersNumbers = teachersList.length;

	const assignmentsList = await Assignment.find({});
	const assignmentsNumbers = assignmentsList.length;

	const classList = await Class.find({});
	const classNumbers = classList.length;

	return {
		studentNumbers: studentNumbers,
		teachersNumbers: teachersNumbers,
		assignmentsNumbers: assignmentsNumbers,
		classNumbers: classNumbers,
	};
}
// FUNCTION TO UPDATE THE MEMBER COUNT
//  GET ALL CLASSES THAT ARE AVAILABLE IN THE DB
async function getClasses() {
	const availableClasses = await Class.find(
		{},
		{ _id: false, className: true }
	);
	const classArr = [];
	availableClasses.forEach((item) => {
		classArr.push(item.className);
	});
	return classArr;
}

// FOR EACH CLASS, COUNT THE STUDENTS WHO HAVE THE CLASS
async function countMembers() {
	const allClasses = await getClasses(); // Await the getClasses function

	const numbers = await Promise.all(
		allClasses.map(async (className) => {
			const count = await counter(className);
			return { className, count };
		})
	);

	//  UPDATE THE CLASS MEMBERS.
	await updateClassMembers(numbers);
}

async function counter(className) {
	let number = await Student.countDocuments({ class: className });
	return number;
}

// Function to update class members
async function updateClassMembers(classCounts) {
	for (const { className, count } of classCounts) {
		await Class.updateOne(
			{ className: className },
			{ $set: { members: count } }
		);
	}
}

function combineDateTime(deadlineDate, deadlineTime) {
	// Parse the input date and time
	let datePart = new Date(deadlineDate);
	let timeParts = deadlineTime.split(":");

	// Set the hours and minutes from the time string
	datePart.setUTCHours(timeParts[0], timeParts[1], 0, 0);

	// Format the combined datetime as ISO string
	let combinedDateTime = datePart.toISOString();

	return combinedDateTime;
}

function formatDate(dateString) {
	// Create a new Date object from the input date string
	const date = new Date(dateString);

	// Extract day, month, and year from the date object
	const day = date.getUTCDate();
	const month = date.getUTCMonth() + 1; // Months are zero-based, so add 1
	const year = date.getUTCFullYear();

	// Format day and month to be two digits
	const formattedDay = day < 10 ? "0" + day : day;
	const formattedMonth = month < 10 ? "0" + month : month;

	// Format year to be in yy format
	const formattedYear = year.toString().slice(-2);

	// Return the formatted date string in dd/mm/yy format
	return `${formattedDay}/${formattedMonth}/${formattedYear}`;
}

function deadlineReached(deadline) {
	// Convert the deadline to a Date object
	const deadlineDate = new Date(deadline);
	// console.log(deadlineDate);

	// Get the current date and time
	const now = new Date();

	// Compare the current date and time with the deadline
	return now >= deadlineDate;
}

module.exports = {
	deadlineReached,
	deleteFile,
	Numbers,
	countMembers,
	combineDateTime,
	formatDate,
};
