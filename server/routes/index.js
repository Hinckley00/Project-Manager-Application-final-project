import express from "express";
import userRoutes from "./userRoutes.js";
import taskRoutes from "./taskRoutes.js";
import commentRoutes from "./commentRoutes.js";

const router = express.Router();

router.use("/user", userRoutes); //api/user/login
router.use("/task", taskRoutes);
router.use("/comment", commentRoutes);

export default router;
