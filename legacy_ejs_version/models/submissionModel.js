const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    assignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true
    },
    submissionDate: {
        type: Date,
        default: Date.now
    },
    filePath: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['submitted', 'graded'],
        default: 'submitted'
    },
    grade: {
        type: String,
        default: null
    },
    feedback: {
        type: String,
        default: null
    }
});

module.exports = mongoose.model('Submission', submissionSchema);