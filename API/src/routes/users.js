const express = require("express");
const auth = require("../middleware/auth");
const User = require("../models/user");
const Project = require("../models/project");

const router = express.Router();

// Apply auth middleware to all routes
// router.use(auth);

// Get all users (for adding to projects)
router.get("/", async (req, res) => {
  try {
    // Get all users except the current user
    const users = await User.find(
      { _id: { $ne: req.userId } },
      "name email role avatarColor"
    ).sort({ name: 1 });

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Failed to fetch users",
    });
  }
});

// Get users in a specific project
router.get("/project/:projectId", async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId).populate(
      "members.user",
      "name email role avatarColor"
    );

    if (!project) {
      return res.status(404).json({
        error: "Not found",
        message: "Project not found",
      });
    }

    // Check if user has access to this project
    const hasAccess =
      project.createdBy.equals(req.userId) ||
      project.members.some((m) => m.user._id.equals(req.userId));

    if (!hasAccess) {
      return res.status(403).json({
        error: "Access denied",
        message: "You do not have access to this project",
      });
    }

    // Extract user data from members
    const projectMembers = project.members.map((member) => ({
      ...member.user.toObject(),
      role: member.role,
      joinedAt: member.joinedAt,
    }));

    res.json({
      success: true,
      members: projectMembers,
    });
  } catch (error) {
    console.error("Get project users error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Failed to fetch project users",
    });
  }
});

// Add member to project
router.post("/project/:projectId/members", async (req, res) => {
  try {
    const { userId, role = "member" } = req.body;
    const projectId = req.params.projectId;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        error: "Not found",
        message: "Project not found",
      });
    }

    // Check if current user is admin or creator
    const isCreator = project.createdBy.equals(req.userId);
    const isAdminMember = project.members.some(
      (m) => m.user.equals(req.userId) && m.role === "admin"
    );

    if (!isCreator && !isAdminMember) {
      return res.status(403).json({
        error: "Access denied",
        message: "Only project admins can add members",
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: "Not found",
        message: "User not found",
      });
    }

    // Check if user is already a member
    const existingMember = project.members.find((m) => m.user.equals(userId));
    if (existingMember) {
      return res.status(400).json({
        error: "Bad request",
        message: "User is already a member of this project",
      });
    }

    // Add member
    project.members.push({
      user: userId,
      role,
      joinedAt: new Date(),
    });

    await project.save();

    // Populate user data
    await project.populate("members.user", "name email role avatarColor");

    const newMember = project.members.find((m) => m.user._id.equals(userId));

    res.status(201).json({
      success: true,
      message: "Member added successfully",
      member: {
        ...newMember.user.toObject(),
        role: newMember.role,
        joinedAt: newMember.joinedAt,
      },
    });
  } catch (error) {
    console.error("Add member error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Failed to add member",
    });
  }
});

// Remove member from project
router.delete("/project/:projectId/members/:userId", async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        error: "Not found",
        message: "Project not found",
      });
    }

    // Check if current user is admin or creator
    const isCreator = project.createdBy.equals(req.userId);
    const isAdminMember = project.members.some(
      (m) => m.user.equals(req.userId) && m.role === "admin"
    );

    if (!isCreator && !isAdminMember) {
      return res.status(403).json({
        error: "Access denied",
        message: "Only project admins can remove members",
      });
    }

    // Don't allow removing creator
    if (project.createdBy.equals(userId)) {
      return res.status(400).json({
        error: "Bad request",
        message: "Cannot remove project creator",
      });
    }

    // Remove member
    const initialLength = project.members.length;
    project.members = project.members.filter((m) => !m.user.equals(userId));

    if (project.members.length === initialLength) {
      return res.status(404).json({
        error: "Not found",
        message: "User is not a member of this project",
      });
    }

    await project.save();

    res.json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Remove member error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Failed to remove member",
    });
  }
});

module.exports = router;
