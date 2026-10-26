import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School ID is required'],
    index: true
  },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  attachments: [{ type: String }],
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  createdAt: { type: Date, default: Date.now },
  readAt: { type: Date }
});

messageSchema.index({ recipient: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
