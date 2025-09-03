import express from "express";
import { isAdminRoute, protectRoute } from "../middlewares/authMiddleware.js";
import {
  createSubTask,
  createTask,
  dashboardStatistics,
  deleteRestoreTask,
  duplicateTask,
  getTask,
  getTasks,
  postTaskActivity,
  trashTask,
  updateTask,
} from "../controllers/taskController.js";

const router = express.Router();

// ----- Admin-only create/duplicate/update -----
router.post("/create", protectRoute, isAdminRoute, createTask);
router.post("/duplicate/:id", protectRoute, isAdminRoute, duplicateTask);
router.post("/activity/:id", protectRoute, postTaskActivity);

// ----- Dashboard stats -----
router.get("/dashboard", protectRoute, dashboardStatistics);

// ----- Subtask + updates -----
router.put("/create-subtask/:id", protectRoute, isAdminRoute, createSubTask);
router.put("/update/:id", protectRoute, isAdminRoute, updateTask);

// ----- Trash specific -----
router.put("/trash/:id", protectRoute, isAdminRoute, trashTask);

// ----- Delete or restore (id optional) -----
router.delete("/delete-restore", protectRoute, isAdminRoute, deleteRestoreTask);
router.delete(
  "/delete-restore/:id",
  protectRoute,
  isAdminRoute,
  deleteRestoreTask
);

// ----- Get all tasks -----
router.get("/", protectRoute, getTasks);

// ----- Get single task (MUST be last to avoid conflicts) -----
router.get("/:id", protectRoute, getTask);

export default router;
