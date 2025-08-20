import express from "express";
import { protectRoute } from "../middlewares/authMiddleware.js";
import {
  getTaskComments,
  createComment,
  updateComment,
  deleteComment,
  addReaction,
  removeReaction,
} from "../controllers/commentController.js";

const router = express.Router();

// Get all comments for a task
router.get("/task/:taskId", protectRoute, getTaskComments);

// Create a new comment
router.post("/", protectRoute, createComment);

// Update a comment
router.put("/:commentId", protectRoute, updateComment);

// Delete a comment
router.delete("/:commentId", protectRoute, deleteComment);

// Add emoji reaction to comment
router.post("/:commentId/reactions", protectRoute, addReaction);

// Remove emoji reaction from comment
router.delete("/:commentId/reactions/:reactionId", protectRoute, removeReaction);

export default router;
