const FeesStructure = require("../models/feesModel");
const Payment = require("../models/paymentModel");
const FeePlan = require("../models/feePlanModel");
const multer = require("multer");
const fs = require("fs");

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

const feesStorage = multer.diskStorage({
     destination: (req, res, cb) => {
         const feesDir = "FeesStructures";
         if (!fs.existsSync(feesDir)) {
             fs.mkdirSync(feesDir);
         }
         cb(null, feesDir);
     },
     filename: (req, file, cb) => {
         const uniqueName = `${Date.now()}_${file.originalname}`;
         cb(null, uniqueName);
     },
});

const upload = multer({
     storage: feesStorage,
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

const fees = {
     upload: upload,
     save: async (fieldname, filePath, creator) => {
         try {
             const newStructure = new FeesStructure({
                 title: fieldname,
                 fileLocation: filePath,
                 creator: creator,
             });
             const savedStructure = newStructure.save();
             if (!savedStructure.error) {
                 return true;
             } else {
                 throw new Error("Fees Structure Not Saved");
             }
         } catch (error) {
             return { error: error.message };
         }
     },
     delete: async (feesStructureId) => {
         try {
             const deletedStructure = await FeesStructure.findByIdAndDelete(
                 feesStructureId
             );

             const deletedActualFile = await deleteFile(deletedStructure.fileLocation);

             if (!deletedStructure.error) {
                 return true;
             } else {
                 throw new Error("File Not Deleted!");
             }
         } catch (error) {
             return { error: error.message };
         }
     },
     list: async () => {
         try {
             const theFeesStructureList = await FeesStructure.find({});
             return theFeesStructureList;
         } catch (error) {
             return { error: error.message };
         }
     },
     getPath: async (feesStructureId) => {
         try {
             const foundFeesStrucutre = await FeesStructure.findById(
                 { _id: feesStructureId },
                 { fileLocation: true }
             );
             if (!foundFeesStrucutre.error && foundFeesStrucutre) {
                 return foundFeesStrucutre.fileLocation;
             } else {
                 throw new Error("Fees Structure Not Found!");
             }
         } catch (error) {
             return { error: error.message };
         }
     },

    // --- 2. ADD NEW PAYMENT FUNCTIONS HERE ---
    getActiveFeePlan: async () => {
        try {
            const plan = await FeePlan.findOne({ active: true }).sort({ createdAt: -1 });
            if (!plan) return { error: 'No active fee plan set by admin' };
            return plan;
        } catch (error) {
            return { error: error.message };
        }
    },

    setFeePlan: async (title, amount, createdBy) => {
        try {
            // Deactivate existing plans
            await FeePlan.updateMany({ active: true }, { $set: { active: false } });
            const plan = new FeePlan({ title, amount, active: true, createdBy });
            await plan.save();
            return plan;
        } catch (error) {
            return { error: error.message };
        }
    },

    recordPayment: async (student, amount, paymentFor, paymentMethod) => {
        try {
            // Enforce admin-decided amount from active plan
            const activePlan = await fees.getActiveFeePlan();
            if (activePlan.error) return { error: activePlan.error };
            const enforcedAmount = activePlan.amount;
            const allowed = ['card','upi','other'];
            const method = allowed.includes(paymentMethod) ? paymentMethod : null;
            if (!method) return { error: 'Invalid payment method' };
            const newPayment = new Payment({
                studentId: student._id,
                studentName: student.username,
                amount: enforcedAmount,
                paymentFor: paymentFor,
                paymentMethod: method,
            });
            await newPayment.save();
            return newPayment;
        } catch (error) {
            return { error: error.message };
        }
    },

    getAllPayments: async (startDate, endDate) => {
        try {
            const query = {};
            if (startDate || endDate) {
                query.paymentDate = {};
                if (startDate) query.paymentDate.$gte = new Date(startDate);
                if (endDate) {
                    const d = new Date(endDate);
                    // include entire end day
                    d.setHours(23, 59, 59, 999);
                    query.paymentDate.$lte = d;
                }
            }
            const payments = await Payment.find(query).sort({ paymentDate: -1 });
            return payments;
        } catch (error) {
            return { error: error.message };
        }
    },

    // Delete payment by id if owned by student
    deleteMyPayment: async (paymentId, studentId) => {
        try {
            const payment = await Payment.findOne({ _id: paymentId, studentId });
            if (!payment) return { error: 'Payment not found or not yours' };
            await Payment.deleteOne({ _id: paymentId });
            return { success: true };
        } catch (error) {
            return { error: error.message };
        }
    },

    // Admin delete arbitrary payment
    deletePaymentByAdmin: async (paymentId) => {
        try {
            const payment = await Payment.findById(paymentId);
            if (!payment) return { error: 'Payment not found' };
            await Payment.deleteOne({ _id: paymentId });
            return { success: true };
        } catch (error) {
            return { error: error.message };
        }
    },

    getPaymentsSummary: async (startDate, endDate) => {
        try {
            const match = {};
            if (startDate || endDate) {
                match.paymentDate = {};
                if (startDate) match.paymentDate.$gte = new Date(startDate);
                if (endDate) {
                    const d = new Date(endDate);
                    d.setHours(23, 59, 59, 999);
                    match.paymentDate.$lte = d;
                }
            }
            const Payment = require('../models/paymentModel');
            const [totals, methodAgg, uniq] = await Promise.all([
                Payment.aggregate([
                    { $match: match },
                    { $group: { _id: null, totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } }
                ]),
                Payment.aggregate([
                    { $match: match },
                    { $group: { _id: '$paymentMethod', count: { $sum: 1 } } }
                ]),
                Payment.distinct('studentId', match)
            ]);
            const totalAmount = (totals[0] && totals[0].totalAmount) || 0;
            const count = (totals[0] && totals[0].count) || 0;
            const uniqueStudents = (uniq && uniq.length) || 0;
            const methodCounts = methodAgg.reduce((acc, row) => {
                acc[row._id || 'other'] = row.count;
                return acc;
            }, { card: 0, upi: 0, other: 0 });
            return { totalAmount, count, uniqueStudents, methodCounts };
        } catch (error) {
            return { error: error.message };
        }
    },

    // Fetch payments for a particular student (by id)
    getPaymentsForStudent: async (studentId) => {
        try {
            const payments = await Payment.find({ studentId }).sort({ paymentDate: -1 });
            return payments;
        } catch (error) {
            return { error: error.message };
        }
    },
};
module.exports = fees;