import mongoose, { Schema } from "mongoose";

const reactionSchema = new Schema({
  emoji: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const commentSchema = new Schema(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, required: true },
    content: { type: String, required: true },
    mentions: [{ type: Schema.Types.ObjectId, ref: "User" }],
    reactions: [reactionSchema],
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
    parentComment: { type: Schema.Types.ObjectId, ref: "Comment" }, // For replies
    replies: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  },
  { timestamps: true }
);

// Index for better query performance
commentSchema.index({ taskId: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ mentions: 1 });

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
