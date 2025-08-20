import Comment from "../models/comment.js";
import Task from "../models/taskModel.js";
import Notice from "../models/notification.js";
import mongoose from "mongoose";

// Get all comments for a task
export const getTaskComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const comments = await Comment.find({ taskId })
      .populate("author", "name email")
      .populate("mentions", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Comment.countDocuments({ taskId });

    res.status(200).json({
      status: true,
      comments,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalComments: count,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

// Create a new comment
export const createComment = async (req, res) => {
  try {
    const { userId } = req.user;
    const { taskId, content, mentions = [], parentComment } = req.body;

    // Verify task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    // Create comment
    const comment = await Comment.create({
      taskId,
      author: userId,
      authorName: req.user.name || "Unknown User",
      content,
      mentions,
      parentComment,
    });

    // Populate author and mentions
    await comment.populate("author", "name email");
    await comment.populate("mentions", "name email");

    // Create notifications for mentioned users
    if (mentions && mentions.length > 0) {
      const notifications = mentions.map(userId => ({
        team: [userId],
        text: `You were mentioned in a comment on task: ${task.title}`,
        task: taskId,
        notiType: "mention",
      }));

      await Notice.insertMany(notifications);
    }

    res.status(201).json({
      status: true,
      message: "Comment created successfully",
      comment,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

// Update a comment
export const updateComment = async (req, res) => {
  try {
    const { userId } = req.user;
    const { commentId } = req.params;
    const { content, mentions = [] } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ status: false, message: "Comment not found" });
    }

    // Check if user owns the comment
    if (comment.author.toString() !== userId) {
      return res.status(403).json({ status: false, message: "Not authorized to edit this comment" });
    }

    comment.content = content;
    comment.mentions = mentions;
    comment.isEdited = true;
    comment.editedAt = new Date();

    await comment.save();

    // Populate author and mentions
    await comment.populate("author", "name email");
    await comment.populate("mentions", "name email");

    res.status(200).json({
      status: true,
      message: "Comment updated successfully",
      comment,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const { userId } = req.user;
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ status: false, message: "Comment not found" });
    }

    // Check if user owns the comment
    if (comment.author.toString() !== userId) {
      return res.status(403).json({ status: false, message: "Not authorized to delete this comment" });
    }

    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({
      status: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

// Add emoji reaction to comment
export const addReaction = async (req, res) => {
  try {
    const { userId } = req.user;
    const { commentId } = req.params;
    const { emoji } = req.body;

    console.log("Add reaction request:", { userId, commentId, emoji, body: req.body });

    // Validate commentId
    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ 
        status: false, 
        message: "Invalid comment ID" 
      });
    }

    // Validate emoji
    if (!emoji || typeof emoji !== 'string') {
      return res.status(400).json({ 
        status: false, 
        message: "Emoji is required and must be a string" 
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ status: false, message: "Comment not found" });
    }

    // If user already has a reaction, update it; otherwise add new
    const existingIndex = comment.reactions.findIndex(
      (reaction) => reaction.userId.toString() === userId
    );

    const updatedReaction = {
      emoji,
      userId,
      userName: req.user.name || "Unknown User",
    };

    if (existingIndex !== -1) {
      comment.reactions[existingIndex] = {
        ...comment.reactions[existingIndex].toObject?.() || comment.reactions[existingIndex],
        ...updatedReaction,
      };
    } else {
      comment.reactions.push(updatedReaction);
    }

    await comment.save();

    // Populate the comment for response
    await comment.populate("author", "name email");

    res.status(200).json({
      status: true,
      message: "Reaction saved",
      comment,
    });
  } catch (error) {
    console.error("Error in addReaction:", error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

// Remove emoji reaction from comment
export const removeReaction = async (req, res) => {
  try {
    const { userId } = req.user;
    const { commentId, reactionId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ status: false, message: "Comment not found" });
    }

    // Find and remove the reaction
    const reactionIndex = comment.reactions.findIndex(
      reaction => reaction._id.toString() === reactionId && reaction.userId.toString() === userId
    );

    if (reactionIndex === -1) {
      return res.status(404).json({ status: false, message: "Reaction not found" });
    }

    comment.reactions.splice(reactionIndex, 1);
    await comment.save();

    res.status(200).json({
      status: true,
      message: "Reaction removed successfully",
      comment,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};
