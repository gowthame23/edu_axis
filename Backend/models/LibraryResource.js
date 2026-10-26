import mongoose from 'mongoose';

const libraryResourceSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: [true, 'School ID is required'],
      index: true
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    author: { type: String, default: '' },
    category: { type: String, default: 'General', index: true },
    tags: { type: [String], default: [], index: true },
    grade: { type: String, default: 'All', index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: false },
    // Either an uploaded file or an external link
    file: {
      path: String,
      filename: String,
      size: Number,
      mimetype: String
    },
    linkUrl: { type: String, default: '' },
    isExternal: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    stats: {
      views: { type: Number, default: 0 },
      downloads: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

libraryResourceSchema.index({ title: 'text', description: 'text', author: 'text', tags: 'text' });
libraryResourceSchema.index({ schoolId: 1, isActive: 1, grade: 1, category: 1, createdAt: -1 });

const LibraryResource = mongoose.model('LibraryResource', libraryResourceSchema);
export default LibraryResource;
