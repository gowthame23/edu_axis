const router = require("express").Router();

const Class = require("../models/classModel");
const thisGuy = require("../middleware/authentications");
// const

// Route to get all classes
router.get("/classes", thisGuy.hasAccess, async (req, res) => {
	try {
		const classes = await Class.find();
		res.json(classes);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// Route to create a new class
router.post("/classes", thisGuy.hasAccess, async (req, res) => {
	try {
		const { className } = req.body;
		const newClass = new Class({
			className: className,
			classCode: className,
		});
		const savedClass = await newClass.save();
		return res.status(201).json({ message: "Class added", class: savedClass });
	} catch (error) {
		return res.status(500).json({ message: "Error creating class", error: error.message });
	}
});
// Route to get a specific class by ID
router.get("/classes/:id", thisGuy.hasAccess, async (req, res) => {
	try {
		const classItem = await Class.findById(req.params.id);
		if (!classItem) return res.status(404).json({ message: "Class not found" });
		res.json(classItem);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// Route to delete a specific class by ID
router.post("/classes/delete/:id", thisGuy.hasAccess, async (req, res) => {
	try {
		const classItem = await Class.findById(req.params.id);
		if (!classItem) {
			return res.status(404).json({ message: "Class not found" });
		}
		await Class.findByIdAndDelete(req.params.id);
		return res.status(200).json({ message: "Class deleted" });
	} catch (err) {
		return res.status(500).json({ message: "Internal Server Error" });
	}
});

// Route to update a specific detail of a class by ID
router.patch("/classes/:id", async (req, res) => {
	try {
		const classItem = await Class.findById(req.params.id);
		if (!classItem) return res.status(404).json({ message: "Class not found" });

		// Update class with the fields provided in the request body
		Object.keys(req.body).forEach((key) => {
			classItem[key] = req.body[key];
		});

		await classItem.save();
		res.json(classItem);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// Function to increment the number of members in the class by one
router.post("/classes/:id/increment-members", async (req, res) => {
	try {
		const classItem = await Class.findById(req.params.id);
		if (!classItem) return res.status(404).json({ message: "Class not found" });

		classItem.members += 1;
		await classItem.save();
		res.json(classItem);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

module.exports = router;
