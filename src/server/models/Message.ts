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
    githubAttachment: {
      type: {
        type: String,
        enum: ['github'],
      },
      url: {
        type: String,
      },
      filename: {
        type: String,
      },
      repoUrl: {
        type: String,
      },
      branch: {
        type: String,
      },
      totalFiles: {
        type: Number,
      },
      totalSize: {
        type: Number,
      }
    },
  },
  { timestamps: true }
);

export default mongoose.models.Message ||
  mongoose.model('Message', MessageSchema); 