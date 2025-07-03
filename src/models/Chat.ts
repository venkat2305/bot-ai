import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const ChatSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      default: () => uuidv4(),
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Chat || mongoose.model('Chat', ChatSchema); 