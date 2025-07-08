import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    images: [{
      url: {
        type: String,
        required: true,
      },
      filename: {
        type: String,
        required: true,
      },
      mimeType: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
        required: true,
      }
    }],
  },
  { timestamps: true }
);

export default mongoose.models.Message ||
  mongoose.model('Message', MessageSchema); 