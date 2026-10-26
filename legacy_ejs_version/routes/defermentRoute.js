const router = require("express").Router();
const flash = require("connect-flash");
const deferment = require("../controllers/defermentController");
const { hasAccess, isAdmin } = require("../middleware/authentications");

router.use(flash());

router
	.post("/save", hasAccess, async (req, res) => {
		const { reason } = req.body;
		const savedDefermentRequest = await deferment.save(
			req.user.username,
			req.user._id,
			reason
		);
		
		// Check if it's an AJAX request
		const isAjax = req.xhr || req.headers.accept.includes('application/json') || req.headers['content-type']?.includes('application/json');
		
		if (!savedDefermentRequest.error) {
			if (isAjax) {
				// For AJAX requests, just return success
				return res.status(200).json({ success: true });
			} else {
				// For regular form submissions, use flash message
				req.flash("info", "Leave Request Sent Successfully!");
			}
		} else {
			if (isAjax) {
				return res.status(400).json({ success: false, message: savedDefermentRequest.error });
			} else {
				req.flash("info", savedDefermentRequest.error);
			}
		}
		res.redirect("/dashboard");
	})
	.post("/delete-all", hasAccess, isAdmin, async (req, res) => {
		const deleted = await deferment.deleteAll();
		if (!deleted.error) {
			req.flash("info", "All leave requests deleted successfully!");
		} else {
			req.flash("info", deleted.error);
		}
		res.redirect("/dashboard");
	})
	.post("/delete/:id", async (req, res) => {
		const { id } = req.params;
		const deletedDefermentRequest = await deferment.delete(id);
		if (!deletedDefermentRequest.error) {
			req.flash("info", "Leave Request Deleted Successfully!");
		} else {
			req.flash("info", deletedDefermentRequest.error);
		}
		res.redirect("/dashboard");
	})
	.get("/approve/:id", async (req, res) => {
		const { id } = req.params;
		const approvedRequest = await deferment.approve(id);
		if (!approvedRequest.error) {
			req.flash("info", "Leave Request Updated Successfully!");
		} else {
			req.flash("info", approvedRequest.error);
		}
		res.redirect("/dashboard");
	})
	.post('/approve/:id', hasAccess, isAdmin, async (req, res) => {
		try {
			const { id } = req.params;
			const result = await deferment.approve(id);
			if (result && result.error) {
				return res.status(400).json({ success: false, message: result.error });
			}
			return res.status(200).json({ success: true });
		} catch (err) {
			return res.status(500).json({ success: false, message: err.message });
		}
	})
	.post('/reject/:id', hasAccess, isAdmin, async (req, res) => {
		try {
			const { id } = req.params;
			const result = await deferment.reject(id);
			if (result && result.error) {
				return res.status(400).json({ success: false, message: result.error });
			}
			return res.status(200).json({ success: true });
		} catch (err) {
			return res.status(500).json({ success: false, message: err.message });
		}
	});

module.exports = router;
