import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['user', 'group'],
      required: true
    },
    name: {
      type: String,
      default: null // For group chats
    },
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    lastMessage: {
      text: String,
      timestamp: Date,
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
chatSchema.index({ participants: 1 });
chatSchema.index({ type: 1, participants: 1 });

// Ensure virtual fields are serialized
chatSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  }
});

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;