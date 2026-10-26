const router = require("express").Router();
const unit = require("../controllers/unitController");
const flash = require("connect-flash");
const thisGuy = require("../middleware/authentications");

router.use(flash());

router
	.post("/", thisGuy.hasAccess, async (req, res) => {
		const { unitName, unitCode, enrollmentKey } = req.body;
		const savedUnit = await unit.save(
			unitName,
			unitCode,
			enrollmentKey,
			req.user._id
		);
		if (!savedUnit.error) {
			req.flash("info", savedUnit.error);
		} else {
			req.flash("info", "Unit Saved Successfully!");
		}
		res.redirect("/dashboard");
	})
	.post("/delete", thisGuy.hasAccess, async (req, res) => {
		const { unitId } = req.body;
		const deletedUnit = await unit.deleteUnit(unitId);
		if (!deletedUnit.error) {
			req.flash("info", "Unit Deleted Successfully!");
		} else {
			req.flash("info", deletedUnit.error);
		}
		res.redirect("/dashboard");
	})
	.get("/delete/:id", thisGuy.hasAccess, async (req, res) => {
		const { id } = req.params;
		const deletedUnit = await unit.deleteUnit(id);
		if (!deletedUnit.error) {
			req.flash("info", "Unit Deleted Successfully!");
		} else {
			req.flash("info", deletedUnit.error);
		}
		res.redirect("/dashboard");
	})

	.post("/search", async (req, res) => {
		const { searchValue } = req.body;
		const theResults = await unit.getSearch(searchValue);
		res.json(theResults);
	})
	.post("/announcement", thisGuy.hasAccess, async (req, res) => {
		const { announcementTitle, announcementDetails, unitId } = req.body;

		try {
			const savedAnnouncement = await unit.announcement.save(
				announcementTitle,
				announcementDetails,
				unitId
			);

			if (savedAnnouncement) {
				req.flash("info", "Announcement saved successfully!");
				return res.redirect("/dashboard");
			} else {
				req.flash("error", "Failed to save the announcement.");
				return res.status(400).redirect("/dashboard");
			}
		} catch (error) {
			req.flash("error", `Error saving announcement: ${error.message}`);
			return res.status(500).redirect("/dashboard");
		}
	})
	.get("/delete/:unitId/:id", thisGuy.hasAccess, async (req, res) => {
		const { unitId, id } = req.params;
		const deletedAnnouncement = await unit.announcement.delete(id, unitId);

		if (!deletedAnnouncement.error) {
			res.json({
				success: true,
				message: "Unit Updated Successfully!",
				unitId,
			});
		} else {
			res.json({ success: false, message: deletedAnnouncement.error });
		}
	});
module.exports = router;
