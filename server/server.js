import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import dbConnection from "./utils/connectDB.js";

dotenv.config();

// Connect to MongoDB
dbConnection();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  },
});

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join task room
  socket.on("join-task", (taskId) => {
    socket.join(`task-${taskId}`);
    console.log(`User ${socket.id} joined task room: ${taskId}`);
  });

  // Leave task room
  socket.on("leave-task", (taskId) => {
    socket.leave(`task-${taskId}`);
    console.log(`User ${socket.id} left task room: ${taskId}`);
  });

  // Handle new comments
  socket.on("new-comment", (data) => {
    const { taskId, comment, mentionedUsers } = data;
    
    // Broadcast to task room
    io.to(`task-${taskId}`).emit("comment-added", {
      ...comment,
      mentionedUsers,
    });

    // Notify mentioned users if any
    if (mentionedUsers && mentionedUsers.length > 0) {
      mentionedUsers.forEach(userId => {
        io.emit("user-mentioned", {
          userId,
          taskId,
          comment: comment.content,
          commenter: comment.author,
        });
      });
    }
  });

  // Handle emoji reactions
  socket.on("emoji-reaction", (data) => {
    const { taskId, commentId, emoji, userId, userName } = data;
    
    io.to(`task-${taskId}`).emit("reaction-added", {
      commentId,
      emoji,
      userId,
      userName,
    });
  });

  // Handle comment updates
  socket.on("comment-updated", (data) => {
    const { taskId, commentId, content } = data;
    
    io.to(`task-${taskId}`).emit("comment-updated", {
      commentId,
      content,
    });
  });

  // Handle comment deletion
  socket.on("comment-deleted", (data) => {
    const { taskId, commentId } = data;
    
    io.to(`task-${taskId}`).emit("comment-deleted", {
      commentId,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Routes
app.use("/api", routes);

const PORT = process.env.PORT || 8800;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
