const router = require("express").Router();
const timetable = require("../controllers/timetableController");
const path = require("path");
const flash = require("connect-flash");

router.use(flash());

router
	.post(
		"/upload",
		timetable.uploadTimetable.single("timetable"),
		async (req, res) => {
			const { file } = req;
			const { path } = file;

			const savedTimetable = await timetable.save(
				file.originalname,
				file.originalname,
				path,
				req.user.username
			);

			if (!savedTimetable.error) {
				req.flash("info", "Timetable Saved Successfully!");
			} else {
				req.flash("info", savedTimetable.error);
			}
			res.redirect("/dashboard");
		}
	)
	.get("/delete/:id", async (req, res) => {
		const { id } = req.params;
		const deletedTimetable = await timetable.delete(id);
		if (!deletedTimetable.error) {
			req.flash("info", deletedTimetable.error);
		} else {
		}
		req.flash("info", "Timetable Deleted Successfully!");
		res.redirect("/dashboard");
	})
	.get("/download/:id", async (req, res) => {
		const { id } = req.params;

		const foundFile = await timetable.getFile(id);

		if (foundFile.error) {
			res.status(404).json(foundFile.error);
		}
		const finalPath = path.join(process.cwd(), foundFile);

		res.download(finalPath, (err) => {
			if (err) {
				console.error("Error downloading file", err);
				return res.status(500).json({ error: "Error downloading file" });
			}
		});
	});
module.exports = router;
