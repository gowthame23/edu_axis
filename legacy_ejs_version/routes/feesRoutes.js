const router = require("express").Router();
const flash = require("connect-flash");
const fees = require("../controllers/feesController");
const path = require("path");
const thisGuy = require("../middleware/authentications");

router.use(flash());

router
	.post("/upload", fees.upload.single("feesStructure"), async (req, res) => {
		try {
			const { file } = req;
			const { originalname, path } = file;
			const creator = req.user.username;

			const savedStructure = await fees.save(originalname, path, creator);
			if (!savedStructure.error) {
				req.flash("info", "Fees Structure Saved Successfully!");
			} else {
				req.flash("info", savedStructure.error);
			}

			res.redirect("/dashboard");
		} catch (error) {
			res
				.status(500)
				.json({ message: "Error uploading file", error: error.message });
		}
	})
	.get("/delete/:id", async (req, res) => {
		const { id } = req.params;
		const deletedStructure = await fees.delete(id);
		if (!deletedStructure.error) {
			req.flash("info", "Fees Structure Deleted Successfully!");
		} else {
			req.flash("info", deletedStructure.error);
		}
		res.redirect("/dashboard");
	})
	.get("/download/:id", async (req, res) => {
		try {
			const { id } = req.params;
			const structureFilePath = await fees.getPath(id);
			if (!structureFilePath.error) {
				const filePath = path.resolve(structureFilePath);
				res.download(filePath, (err) => {
					if (err) {
						console.error("Error downloading file", err);
						return res.status(500).json({ error: "Error downloading file" });
					}
				});
			}
		} catch (err) {
			console.error("Error fetching assignment", err);
			res.status(500).json({ error: "Server error" });
		}
	})
    // --- NEW ROUTE TO RECORD PAYMENT ---
	.post("/record-payment", async (req, res) => {
		try {
			const student = req.user;  
			let { amount, paymentFor, paymentMethod } = req.body;
			// amount from client is ignored; admin-enforced amount is used via controller
			if (!student || !paymentFor) {
				return res.status(400).json({ message: "Missing payment details" });
			}

			// Enforce valid payment method
			const allowedMethods = ["card", "upi", "other"]; // 'other' reserved for future
			if (!paymentMethod || !allowedMethods.includes(paymentMethod)) {
				return res.status(400).json({ message: "Please select a valid payment method" });
			}

			const paymentRecord = await fees.recordPayment(student, amount, paymentFor, paymentMethod);

			if (!paymentRecord.error) {
				res.status(200).json({ message: "Payment recorded successfully", amount: paymentRecord.amount });
			} else {
				res
					.status(500)
					.json({ message: "Failed to record payment", error: paymentRecord.error });
			}
		} catch (error) {
			res
				.status(500)
				.json({ message: "Server error", error: error.message });
		}
	})
	// Admin page to set plan
	.get('/plan', thisGuy.hasAccess, thisGuy.isAdmin, async (req, res) => {
		const plan = await fees.getActiveFeePlan();
		res.render('feePlan', { feePlan: plan && !plan.error ? plan : null, formatDate: (d)=> new Date(d).toDateString(), info: req.flash('info'), success: req.flash('success'), error: req.flash('error') });
	})
	// Get current fee plan
    .get('/current-plan', async (req, res) => {
        try {
            const plan = await fees.getActiveFeePlan();
            if (plan.error) return res.status(404).json({ error: plan.error });
            res.status(200).json(plan);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    })
    // Set fee plan (Admin)
	.post('/plan', thisGuy.hasAccess, thisGuy.isAdmin, async (req, res) => {
        try {
			let { title, amount } = req.body;
			if (!title || amount === undefined) {
				req.flash('info', 'Title and amount are required');
				return res.redirect('/dashboard');
			}
			if (typeof amount === 'string') {
				amount = amount.replace(/[\,\s]/g, '');
			}
			const parsed = Number(amount);
			if (!isFinite(parsed) || parsed < 0) {
				req.flash('info', 'Please enter a valid non-negative amount');
				return res.redirect('/dashboard');
			}
			const plan = await fees.setFeePlan(title, parsed, req.user.username);
			if (plan.error) {
				req.flash('info', plan.error);
				return res.redirect('/dashboard');
			}
			req.flash('info', 'Fee plan updated');
			return res.redirect('/dashboard');
        } catch (error) {
			req.flash('info', error.message);
			return res.redirect('/dashboard');
        }
    })
	// Delete payment (student can delete own payment)
	.delete('/my-payments/:id', async (req, res) => {
		try {
			const result = await fees.deleteMyPayment(req.params.id, req.user._id);
			if (result.error) return res.status(400).json({ error: result.error });
			res.status(200).json({ success: true });
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	})
	  
	.delete('/payments/:id', thisGuy.hasAccess, thisGuy.isAdmin, async (req, res) => {
		try {
			const result = await fees.deletePaymentByAdmin(req.params.id);
			if (result.error) return res.status(404).json({ error: result.error });
			res.status(200).json({ success: true });
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	})
	// List all payments (admin) with optional date range
	.get("/payments", thisGuy.hasAccess, thisGuy.isAdmin, async (req, res) => {
		try {
			const { startDate, endDate } = req.query;
			const payments = await fees.getAllPayments(startDate, endDate);
			if (payments.error) return res.status(500).json({ error: payments.error });
			res.status(200).json(payments);
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	})
	// Payments summary (admin) with date range
	.get("/payments/summary", thisGuy.hasAccess, thisGuy.isAdmin, async (req, res) => {
		try {
			const { startDate, endDate } = req.query;
			const summary = await fees.getPaymentsSummary(startDate, endDate);
			if (summary.error) return res.status(500).json({ error: summary.error });
			res.status(200).json(summary);
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	})
	// CSV download (admin)
	.get("/payments.csv", thisGuy.hasAccess, thisGuy.isAdmin, async (req, res) => {
		try {
			const { startDate, endDate } = req.query;
			const payments = await fees.getAllPayments(startDate, endDate);
			if (payments.error) return res.status(500).json({ error: payments.error });
			const header = ["studentName","studentId","amount","paymentFor","method","paymentDate"];
			const rows = payments.map(p => [
				p.studentName,
				p.studentId,
				p.amount,
				`"${(p.paymentFor || '').replace(/"/g,'""')}"`,
				p.paymentMethod || 'other',
				new Date(p.paymentDate).toISOString(),
			].join(","));
			const csv = [header.join(","), ...rows].join("\n");
			res.setHeader("Content-Type", "text/csv");
			res.setHeader("Content-Disposition", "attachment; filename=payments.csv");
			res.status(200).send(csv);
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	})
	// List payments for the logged-in student
	.get("/my-payments", thisGuy.hasAccess, async (req, res) => {
		try {
			const payments = await fees.getPaymentsForStudent(req.user._id);
			if (payments.error) return res.status(500).json({ error: payments.error });
			res.status(200).json(payments);
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	});

module.exports = router;