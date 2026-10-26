import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure storage for assignment files
const assignmentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/assignments'));
  },
  filename: function (req, file, cb) {
    // Create unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  }
});

// File filter to allow only certain types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Word, PowerPoint, Excel, images, text and zip files are allowed.'), false);
  }
};

// Create multer instance for assignments
export const uploadAssignmentFiles = multer({
  storage: assignmentStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit per file
  }
});

// Configure storage for student submission files
const submissionStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/submissions'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  }
});

// Multer instance for student submissions
export const uploadSubmissionFiles = multer({
  storage: submissionStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB per file
  }
});

// Storage for library resources
const libraryStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/library'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  }
});

export const uploadLibraryFiles = multer({
  storage: libraryStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

// Storage for timetable attachments (PDF/images)
const timetableStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/timetables'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  }
});

export const uploadTimetableFiles = multer({
  storage: timetableStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

// Storage for study materials
const studyMaterialStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/study-materials'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  }
});

export const uploadStudyMaterialFiles = multer({
  storage: studyMaterialStorage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for study materials
  }
});

const csvMemoryStorage = multer.memoryStorage();

const csvFileFilter = (req, file, cb) => {
  const lowerName = (file.originalname || '').toLowerCase();
  const isCsvMime = file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel';
  const isCsvExt = lowerName.endsWith('.csv');

  if (isCsvMime || isCsvExt) {
    cb(null, true);
    return;
  }

  cb(new Error('Invalid file type. Only CSV files are allowed.'), false);
};

export const uploadCSVFile = multer({
  storage: csvMemoryStorage,
  fileFilter: csvFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});
