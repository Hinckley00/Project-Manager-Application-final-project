import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import {
  MdEdit,
  MdDelete,
  MdReply,
  MdAttachFile,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdKeyboardDoubleArrowUp,
} from "react-icons/md";
import { BiMessageAltDetail } from "react-icons/bi";
import { FaList, FaSmile } from "react-icons/fa";
import clsx from "clsx";

// Try to import socket.io-client, fallback to mock if it fails
let io;
try {
  io = require("socket.io-client");
} catch (error) {
  console.warn("socket.io-client not available, using mock");
  io = () => ({
    emit: () => {},
    on: () => {},
    disconnect: () => {},
  });
}

// Try to import react-mentions, fallback to regular textarea if it fails
let MentionsInput, Mention;
try {
  const mentionsModule = require("react-mentions");
  MentionsInput = mentionsModule.MentionsInput;
  Mention = mentionsModule.Mention;
} catch (error) {
  console.warn("react-mentions not available, using fallback textarea");
  MentionsInput = ({ children, value, onChange, placeholder, className }) => (
    <textarea
      value={value}
      onChange={(e) => onChange(e, e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
  Mention = ({ children }) => children;
}

import { BGS, PRIORITYSTYLES, TASK_TYPE, getInitials } from "../utils";
import UserInfo from "../components/UserInfo";
import Button from "../components/Button";
import Loading from "../components/Loader";
import ConfirmationDialog from "../components/Dialogs";
import { useGetSingleTaskQuery } from "../redux/slices/api/taskApiSlice";

// Simple date formatter to replace date-fns
const formatDate = (date) => {
  const d = new Date(date);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
};

const formatDateTime = (date) => {
  const d = new Date(date);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${d.getDate()} ${
    months[d.getMonth()]
  }, ${d.getFullYear()} at ${hours}:${minutes}`;
};

const ICONS = {
  high: <MdKeyboardDoubleArrowUp />,
  medium: <MdKeyboardArrowUp />,
  normal: <MdKeyboardArrowUp />,
  low: <MdKeyboardArrowDown />,
};

const EMOJIS = [
  "👍",
  "❤️",
  "😄",
  "😮",
  "😢",
  "😡",
  "🎉",
  "🔥",
  "💯",
  "👏",
  "🤔",
  "👀",
  "💪",
  "🚀",
  "⭐",
  "💡",
  "🎯",
  "✅",
  "❌",
  "⚠️",
];

const TaskDetails = () => {
  const { id } = useParams();
  const { data, isLoading } = useGetSingleTaskQuery(id);
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editingStates, setEditingStates] = useState({}); // { [commentId]: string }
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [error, setError] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState(null);

  const socketRef = useRef();
  const commentEndRef = useRef();
  const fileInputRef = useRef();

  // Tabs: 'details' | 'activity'
  const [activeTab, setActiveTab] = useState("details");

    // if (isLoading) {
    //   return(
    //     <div className="py-10">
    //       <Loading />
    //     </div>
    //   )
    // }

  // Simple fallback if user is not available
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-4">
              Please log in to view task details.
            </p>
            <Button
              label="Go Back"
              onClick={() => navigate(-1)}
              className="bg-blue-600 text-white px-4 py-2"
            />
          </div>
        </div>
      </div>
    );
  }

  // Initialize Socket.IO connection
  useEffect(() => {
    try {
      // Use the Vite proxy for Socket.IO connection
      socketRef.current = io("http://localhost:8800", {
        withCredentials: true,
      });

      // Join task room
      socketRef.current.emit("join-task", id);

      // Socket event listeners
      socketRef.current.on("comment-added", handleNewComment);
      socketRef.current.on("comment-updated", handleCommentUpdated);
      socketRef.current.on("comment-deleted", handleCommentDeleted);
      socketRef.current.on("reaction-added", handleReactionAdded);
      socketRef.current.on("user-mentioned", handleUserMentioned);

      return () => {
        if (socketRef.current) {
          socketRef.current.emit("leave-task", id);
          socketRef.current.disconnect();
        }
      };
    } catch (error) {
      console.error("Socket.IO connection error:", error);
      setError("Failed to connect to real-time service");
    }
  }, [id]);

  // Fetch task and comments
  useEffect(() => {
    fetchTaskDetails();
    fetchComments();
  }, [id]);

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    commentEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const fetchTaskDetails = async () => {
    try {
      const response = await fetch(`/api/task/${id}`, {
        credentials: "include",
      });
      const data = await response.json();

      if (data.status) {
        setTask(data.task);
        setTeamMembers(data.task.team || []);
      }
    } catch (error) {
      console.error("Error fetching task:", error);
      toast.error("Failed to load task details");
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comment/task/${id}`, {
        credentials: "include",
      });
      const data = await response.json();

      if (data.status) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const handleNewComment = (comment) => {
    setComments((prev) => [comment, ...prev]);
  };

  const handleCommentUpdated = ({ commentId, content }) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment._id === commentId
          ? { ...comment, content, isEdited: true, editedAt: new Date() }
          : comment
      )
    );
  };

  const handleCommentDeleted = ({ commentId }) => {
    setComments((prev) => prev.filter((comment) => comment._id !== commentId));
  };

  const handleReactionAdded = ({ commentId, emoji, userId, userName }) => {
    setComments((prev) =>
      prev.map((comment) => {
        if (comment._id !== commentId) return comment;
        // Remove any previous reaction by this user, then add the new one
        const filtered = comment.reactions.filter((r) => r.userId !== userId);
        return {
          ...comment,
          reactions: [...filtered, { emoji, userId, userName }],
        };
      })
    );
  };

  const handleUserMentioned = ({ userId, taskId, comment, commenter }) => {
    if (userId === user._id) {
      toast.info(`You were mentioned by ${commenter.name} in a comment`);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;

    try {
      // Extract mentions from comment text
      const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
      const mentions = [];
      let match;

      while ((match = mentionRegex.exec(commentText)) !== null) {
        mentions.push(match[2]); // match[2] contains the user ID
      }

      const response = await fetch("/api/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          taskId: id,
          content: commentText,
          mentions,
          parentComment: replyingTo?._id,
        }),
      });

      const data = await response.json();

      if (data.status) {
        // Emit socket event for real-time updates
        socketRef.current.emit("new-comment", {
          taskId: id,
          comment: data.comment,
          mentionedUsers: mentions,
        });

        // Immediate local insert so it appears without waiting for socket
        setComments((prev) => [data.comment, ...prev]);

        setCommentText("");
        setReplyingTo(null);
        toast.success("Comment added successfully");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const updateComment = async (commentId, content) => {
    try {
      const response = await fetch(`/api/comment/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (data.status) {
        // Prefer server-canonical updated comment when available, else optimistic
        setComments((prev) =>
          prev.map((comment) =>
            comment._id === commentId
              ? data.comment || {
                  ...comment,
                  content,
                  isEdited: true,
                  editedAt: new Date(),
                }
              : comment
          )
        );

        socketRef.current.emit("comment-updated", {
          taskId: id,
          commentId,
          content,
        });
        // Clear inline edit state for this comment
        setEditingStates((prev) => {
          const next = { ...prev };
          delete next[commentId];
          return next;
        });
        toast.success("Comment updated successfully");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment");
    }
  };

  const deleteComment = async (commentId) => {
    try {
      const response = await fetch(`/api/comment/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (data.status) {
        // Optimistic local removal so the author sees deletion immediately
        setComments((prev) =>
          prev.filter((comment) => comment._id !== commentId)
        );

        socketRef.current.emit("comment-deleted", {
          taskId: id,
          commentId,
        });

        toast.success("Comment deleted successfully");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  const onRequestDelete = (commentId) => {
    setDeleteCommentId(commentId);
    setOpenDeleteDialog(true);
  };

  const addReaction = async (commentId, emoji) => {
    try {
      const response = await fetch(`/api/comment/${commentId}/reactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ emoji }),
      });

      const data = await response.json();

      if (data.status) {
        // Optimistic local update: replace my previous reaction on this comment
        setComments((prev) =>
          prev.map((c) => {
            if (c._id !== commentId) return c;
            const filtered = c.reactions.filter((r) => r.userId !== user._id);
            return {
              ...c,
              reactions: [
                ...filtered,
                { emoji, userId: user._id, userName: user.name },
              ],
            };
          })
        );

        socketRef.current.emit("emoji-reaction", {
          taskId: id,
          commentId,
          emoji,
          userId: user._id,
          userName: user.name,
        });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast.error("Failed to add reaction");
    }
  };

  const removeReaction = async (commentId, reactionId) => {
    try {
      const response = await fetch(
        `/api/comment/${commentId}/reactions/${reactionId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (data.status) {
        // Update local state
        setComments((prev) =>
          prev.map((comment) =>
            comment._id === commentId
              ? {
                  ...comment,
                  reactions: comment.reactions.filter(
                    (r) => r._id !== reactionId
                  ),
                }
              : comment
          )
        );
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error removing reaction:", error);
      toast.error("Failed to remove reaction");
    }
  };

  const handleMentionChange = (
    event,
    newValue,
    newPlainTextValue,
    mentions
  ) => {
    setCommentText(newValue);
  };

  const renderComment = (comment, isReply = false) => {
    const isOwner = comment.author._id === user._id;
    const hasReacted = comment.reactions.some((r) => r.userId === user._id);

    return (
      <div
        key={comment._id}
        className={clsx(
          "bg-white rounded-lg p-4 mb-4 shadow-sm border",
          isReply && "ml-8 border-l-2 border-blue-200"
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">
              {getInitials(comment.author.name)}
            </div>
            <div>
              <p className="font-medium text-gray-900">{comment.author.name}</p>
              <p className="text-xs text-gray-500">
                {formatDateTime(comment.createdAt)}
                {comment.isEdited && " (edited)"}
              </p>
            </div>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingComment(comment)}
                className="text-gray-500 hover:text-blue-600"
              >
                <MdEdit size={16} />
              </button>
              <button
                onClick={() => deleteComment(comment._id)}
                className="text-gray-500 hover:text-red-600"
              >
                <MdDelete size={16} />
              </button>
            </div>
          )}
        </div>

        {editingComment?._id === comment._id ? (
          <div className="mb-3">
            <MentionsInput
              value={editingComment.content}
              onChange={(event, newValue) =>
                setEditingComment({ ...editingComment, content: newValue })
              }
              className="mentions-input"
              placeholder="Edit your comment..."
            >
              <Mention
                trigger="@"
                data={teamMembers.map((member) => ({
                  id: member._id,
                  display: member.name,
                }))}
                renderSuggestion={(suggestion, search, highlightedDisplay) => (
                  <div className="flex items-center gap-2 p-2 hover:bg-gray-100">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                      {getInitials(suggestion.display)}
                    </div>
                    <span>{highlightedDisplay}</span>
                  </div>
                )}
              />
            </MentionsInput>
            <div className="flex gap-2 mt-2">
              <Button
                label="Save"
                onClick={() =>
                  updateComment(comment._id, editingComment.content)
                }
                className=" bg-gradient-to-r from-teal-700 via-blue-600 to-sky-400 text-white px-3 py-1 text-sm"
              />
              <Button
                label="Cancel"
                onClick={() => setEditingComment(null)}
                className="bg-gray-300 text-gray-700 px-3 py-1 text-sm"
              />
            </div>
          </div>
        ) : (
          <div className="mb-3">
            <div
              className="text-gray-800 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: comment.content.replace(
                  /@\[([^\]]+)\]\(([^)]+)\)/g,
                  '<span class="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-sm">@$1</span>'
                ),
              }}
            />
          </div>
        )}

        {/* Reactions */}
        <div className="flex items-center gap-2 mb-3">
          {comment.reactions.length > 0 && (
            <div className="flex items-center gap-1">
              {Object.entries(
                comment.reactions.reduce((acc, reaction) => {
                  acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                  return acc;
                }, {})
              ).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => addReaction(comment._id, emoji)}
                  className={clsx(
                    "px-2 py-1 rounded-full text-sm border transition-colors",
                    hasReacted
                      ? "bg-blue-100 border-blue-300"
                      : "bg-gray-100 border-gray-300 hover:bg-gray-200"
                  )}
                >
                  {emoji} {count}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() =>
              setShowEmojiPicker(
                showEmojiPicker === comment._id ? null : comment._id
              )
            }
            className="text-gray-500 hover:text-blue-600 flex items-center gap-1"
          >
            <span className="text-sm">😊</span>
            {/* <span className="text-xs">More</span> */}
          </button>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker === comment._id && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg mb-3">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  addReaction(comment._id, emoji);
                  setShowEmojiPicker(null);
                }}
                className="text-2xl hover:scale-110 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={() =>
              setReplyingTo(replyingTo?._id === comment._id ? null : comment)
            }
            className="flex items-center gap-1 text-gray-500 hover:text-blue-600"
          >
            <MdReply size={16} />
            Reply
          </button>
        </div>

        {/* Reply Form */}
        {replyingTo?._id === comment._id && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <MentionsInput
              value={commentText}
              onChange={handleMentionChange}
              className="mentions-input mb-2"
              placeholder={`Reply to ${comment.author.name}...`}
            >
              <Mention
                trigger="@"
                data={teamMembers.map((member) => ({
                  id: member._id,
                  display: member.name,
                }))}
                renderSuggestion={(suggestion, search, highlightedDisplay) => (
                  <div className="flex items-center gap-2 p-2 hover:bg-gray-100">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                      {getInitials(suggestion.display)}
                    </div>
                    <span>{highlightedDisplay}</span>
                  </div>
                )}
              />
            </MentionsInput>
            <div className="flex gap-2">
              <Button
                label="Reply"
                onClick={submitComment}
                className="bg-blue-600 text-white px-3 py-1 text-sm"
              />
              <button
                onClick={() => setReplyingTo(null)}
                className="text-gray-500 hover:text-gray-700 px-3 py-1 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {error ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              Connection Error
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              label="Go Back"
              onClick={() => navigate(-1)}
              className="bg-blue-600 text-white px-4 py-2"
            />
          </div>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loading />
        </div>
      ) : !task ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Task Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              The task you're looking for doesn't exist.
            </p>
            <Button
              label="Go Back"
              onClick={() => navigate(-1)}
              className="bg-blue-600 text-white px-4 py-2"
            />
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Top header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-blue-700 font-semibold text-sm py-4"
            >
              ← Back to Tasks
            </button>
            <h1 className="text-2xl font-bold text-gray-600">{task.title}</h1>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mb-6 py-3">
            <button
              onClick={() => setActiveTab("details")}
              className={clsx(
                "px-3 py-2 text-sm font-medium rounded-t-md",
                activeTab === "details"
                  ? "bg-white border border-b-transparent border-gray-200 text-gray-900"
                  : "text-gray-600 hover:text-gray-800"
              )}
            >
              Task Detail
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={clsx(
                "px-3 py-2 text-sm font-medium rounded-t-md",
                activeTab === "activity"
                  ? "bg-white border border-b-transparent border-gray-200 text-gray-900"
                  : "text-gray-600 hover:text-gray-800"
              )}
            >
              Activities/Timeline
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "details" ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {/* Status and Priority */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <div
                    className={clsx(
                      "w-3 h-3 rounded-full",
                      TASK_TYPE[task.stage]
                    )}
                  />
                  <span className="text-sm font-medium text-gray-600 uppercase">
                    {task.stage}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={clsx("text-lg", PRIORITYSTYLES[task.priority])}
                  >
                    {ICONS[task.priority]}
                  </span>
                  <span className="text-sm font-medium capitalize">
                    {task.priority} Priority
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="grid md:grid-cols-2 gap-6 pt-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Task Information
                  </h3>
                  <div className="space-y-2 pt-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Created At</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(task.createdAt)}
                      </span>
                    </div>
                    <br />
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Due Date</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(task.date)}
                      </span>
                    </div>
                    <br />
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {task.stage}
                      </span>
                    </div>
                    <br />
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Priority</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Description
                  </h3>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                    {task.description || "No description provided"}
                  </p>
                </div>
              </div>

              {/* Team Members */}
              <div className="mt-6 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Team Members
                </h3>
                <div className="grid sm:grid-cols-2 gap-2">
                  {task.team.map((member, index) => (
                    <div
                      key={member._id}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                    >
                      <div
                        className={clsx(
                          "w-8 h-8 rounded-full text-white flex items-center justify-center text-sm",
                          BGS[index % BGS.length]
                        )}
                      >
                        <UserInfo user={member} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {member.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {member.role || "Team Member"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assets */}
              {task.assets && task.assets.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Attachments ({task.assets.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {task.assets.map((asset, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={asset.link}
                          alt={asset.name}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <button
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = asset.link;
                              link.download = asset.name;
                              link.click();
                            }}
                            className="opacity-0 group-hover:opacity-100 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-all duration-200"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              {task.links && task.links.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Links
                  </h3>
                  <div className="space-y-2">
                    {task.links.map((link, index) => (
                      <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-blue-600 hover:text-blue-700 hover:underline text-sm bg-blue-50 p-2 rounded-lg"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtasks */}
              {task.subTasks && task.subTasks.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Subtasks ({task.subTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {task.subTasks.map((subtask, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 flex flex-col">
              <div className="border-b border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Activities & Timeline
                </h2>
                <p className="text-sm text-gray-600">
                  Track progress and collaborate with your team
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <div className="space-y-8">
                  {comments.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BiMessageAltDetail className="text-gray-400 text-2xl" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No activities yet
                      </h3>
                      <p className="text-gray-600">
                        Start the conversation by adding a comment or update
                      </p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment._id} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm flex-shrink-0">
                          {getInitials(comment.author.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 space-y-3">
                            <div className="flex items-center gap-4 mb-1">
                              <span className="text-gray-900 text-sm font-semibold uppercase">
                                {comment.author.name}
                              </span>
                              <span className="text-gray-500">-</span>
                              <span className="text-xs text-gray-500">
                                {formatDateTime(comment.createdAt)}
                              </span>
                              {comment.isEdited && (
                                <span className="text-xs text-gray-400">
                                  (edited)
                                </span>
                              )}
                            </div>
                            {editingStates[comment._id] !== undefined ? (
                              <div className="pt-2 space-y-2">
                                <textarea
                                  value={editingStates[comment._id]}
                                  onChange={(e) =>
                                    setEditingStates((prev) => ({
                                      ...prev,
                                      [comment._id]: e.target.value,
                                    }))
                                  }
                                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-600"
                                  rows="3"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    label="Save"
                                    onClick={() =>
                                      updateComment(
                                        comment._id,
                                        editingStates[comment._id]
                                      )
                                    }
                                    className=" bg-gray-300 text-gray-700 px-3 py-1 text-sm"
                                  />
                                  <Button
                                    label="Cancel"
                                    onClick={() =>
                                      setEditingStates((prev) => {
                                        const next = { ...prev };
                                        delete next[comment._id];
                                        return next;
                                      })
                                    }
                                    className="bg-gray-300 text-gray-700 px-3 py-1 text-sm"
                                  />
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-700 text-sm pt-2">
                                {comment.content}
                              </p>
                            )}
                            <br />
                            {comment.reactions.length > 0 && (
                              <div className="flex items-center gap-1">
                                {Object.entries(
                                  comment.reactions.reduce((acc, r) => {
                                    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                    return acc;
                                  }, {})
                                ).map(([emoji, count]) => (
                                  <span
                                    key={emoji}
                                    className="text-xs bg-gray-100 px-2 py-1 rounded"
                                  >
                                    {emoji} {count}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-xs pt-1">
                              <button
                                onClick={() =>
                                  setShowEmojiPicker(
                                    showEmojiPicker === comment._id
                                      ? null
                                      : comment._id
                                  )
                                }
                                className="text-gray-500 hover:text-blue-600 flex items-center gap-1"
                              >
                                <span className="text-sm">😊</span>
                                <span className="text-xs">..</span>
                              </button>
                              {comment.author._id === user._id && (
                                <>
                                  <button
                                    onClick={() =>
                                      setEditingStates((prev) => ({
                                        ...prev,
                                        [comment._id]: comment.content,
                                      }))
                                    }
                                    className="text-gray-500 hover:text-blue-600"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => onRequestDelete(comment._id)}
                                    className="text-gray-500 hover:text-red-600"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                            {showEmojiPicker === comment._id && (
                              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-medium text-gray-700">
                                    Choose reaction:
                                  </span>
                                  <button
                                    onClick={() => setShowEmojiPicker(null)}
                                    className="text-gray-400 hover:text-gray-600 text-sm"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <div className="grid grid-cols-10 gap-2">
                                  {EMOJIS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => {
                                        addReaction(comment._id, emoji);
                                        setShowEmojiPicker(null);
                                      }}
                                      className="text-xl hover:scale-110 transition-transform p-1 rounded hover:bg-gray-200"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div ref={commentEndRef} />
              </div>
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm flex-shrink-0">
                    {getInitials(user.name)}
                  </div>
                  <div className="flex-1 flex gap-2">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment or activity update..."
                      className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      rows="2"
                    />
                    <Button
                      label="Send"
                      onClick={submitComment}
                      disabled={!commentText.trim()}
                      className=" bg-gradient-to-r from-teal-700 via-blue-600 to-sky-400 text-white px-4 py-2 text-sm disabled:bg-gray-300 disabled:cursor-not-allowed self-end"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <ConfirmationDialog
        open={openDeleteDialog}
        setOpen={setOpenDeleteDialog}
        msg="Do you want to delete comment?"
        onClick={() => {
          const idToDelete = deleteCommentId;
          setOpenDeleteDialog(false);
          if (idToDelete) deleteComment(idToDelete);
        }}
      />
    </div>
  );
};

export default TaskDetails;
