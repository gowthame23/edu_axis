const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Submission = require('../models/submissionModel');
const Assignment = require('../models/assignmentModel');
const thisGuy = require('../middleware/authentications');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '..', 'public', 'uploads', 'submissions');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Include assignment ID and student ID in filename for better organization
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `${req.params.assignmentId}-${req.user._id}-${uniqueSuffix}${path.extname(file.originalname)}`;
        cb(null, filename);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx', '.zip', '.rar', '.txt'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, DOC, DOCX, ZIP, RAR, and TXT files are allowed.'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
}).single('submission');

// Multer error handling middleware
const handleUpload = (req, res, next) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer error:', err);
            return res.status(400).json({ error: err.message });
        } else if (err) {
            console.error('Upload error:', err);
            return res.status(500).json({ error: err.message });
        }
        // Everything went fine
        next();
    });
};

// Submit assignment
router.post('/submit-assignment/:assignmentId', thisGuy.isStudent, handleUpload, async (req, res) => {
    try {
        const assignmentId = req.params.assignmentId;
        const studentId = req.user._id;

        // Check if assignment exists
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        // Check if deadline has passed
        if (new Date() > new Date(assignment.deadline)) {
            return res.status(400).json({ error: 'Assignment deadline has passed' });
        }

        // Check if already submitted
        const existingSubmission = await Submission.findOne({
            student: studentId,
            assignment: assignmentId
        });

        if (existingSubmission) {
            // Delete old file if it exists
            if (existingSubmission.filePath) {
                const oldFilePath = path.join(__dirname, '..', 'public', existingSubmission.filePath);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }

            // Update existing submission
            existingSubmission.filePath = '/uploads/submissions/' + req.file.filename;
            existingSubmission.fileName = req.file.originalname;
            existingSubmission.submissionDate = Date.now();
            await existingSubmission.save();
            return res.status(200).json({ message: 'Assignment updated successfully' });
        }

        // Create new submission
        const submission = new Submission({
            student: studentId,
            assignment: assignmentId,
            filePath: '/uploads/submissions/' + req.file.filename,
            fileName: req.file.originalname
        });

        await submission.save();
        res.status(200).json({ message: 'Assignment submitted successfully' });
    } catch (error) {
        console.error('Submission error:', error);
        res.status(500).json({ error: 'Error submitting assignment' });
    }
});

// Get submissions for an assignment (for teachers)
router.get('/submissions/:assignmentId', thisGuy.isTeacher, async (req, res) => {
    try {
        const submissions = await Submission.find({ assignment: req.params.assignmentId })
            .populate('student', 'name username')
            .populate('assignment', 'title');
        res.json(submissions);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Error fetching submissions' });
    }
});

// Grade submission
router.post('/grade-submission/:submissionId', thisGuy.isTeacher, async (req, res) => {
    try {
        const { grade, feedback } = req.body;
        const submissionId = req.params.submissionId;

        const submission = await Submission.findById(submissionId);
        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        submission.grade = grade;
        submission.feedback = feedback;
        submission.status = 'graded';
        await submission.save();

        res.status(200).json({ message: 'Submission graded successfully' });
    } catch (error) {
        console.error('Error grading submission:', error);
        res.status(500).json({ error: 'Error grading submission' });
    }
});

// Get student's submissions
router.get('/my-submissions', thisGuy.isStudent, async (req, res) => {
    try {
        const submissions = await Submission.find({ student: req.user._id })
            .populate('assignment', 'title deadline')
            .sort('-submissionDate');
        res.json(submissions);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Error fetching your submissions' });
    }
});

module.exports = router;