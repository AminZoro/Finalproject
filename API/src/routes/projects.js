const express = require("express");
const auth = require("../middleware/auth");
const Project = require("../models/project");
const Task = require("../models/task");

const router = express.Router();


// Get all projects for user
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find({
      
    })
      
      .populate("members.user", "name email avatarColor")
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Failed to fetch projects",
    });
  }
});

// Create project
router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "Validation error",
        message: "Project name is required",
      });
    }

    const project = new Project({
      name,
      description,
      
    });

    await project.save();

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation error",
        message: error.message,
      });
    }

    res.status(500).json({
      error: "Server error",
      message: "Failed to create project",
    });
  }
});

// Add member to project
router.post("/:projectId/members", async (req, res) => {
  try {
    const { userId, role = "member" } = req.body;
    const { projectId } = req.params;

    // Validate ObjectId format
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        error: "Invalid project ID",
        message: "Project ID must be a valid MongoDB ObjectId",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: "Invalid user ID",
        message:
          "User ID must be a valid MongoDB ObjectId. Please select a user from the database.",
      });
    }

    // Find project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        error: "Project not found",
        message: "Project does not exist",
      });
    }

    // Find user
    const User = require("../models/user");
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "User does not exist in the database",
      });
    }

    // Check if already a member
    const existingMember = project.members.find(
      (member) => member.user.toString() === userId
    );

    if (existingMember) {
      return res.status(400).json({
        error: "Already a member",
        message: "User is already a member of this project",
      });
    }

    // Add member
    project.members.push({
      user: userId,
      role: role,
      joinedAt: new Date(),
    });

    await project.save();

    // Populate user data
    await project.populate("members.user", "name email role avatarColor");

    // Find the new member
    const newMember = project.members.find(
      (member) => member.user._id.toString() === userId
    );

    res.status(201).json({
      success: true,
      message: "Member added successfully",
      member: {
        userId: newMember.user._id,
        name: newMember.user.name,
        email: newMember.user.email,
        role: newMember.role,
        joinedAt: newMember.joinedAt,
      },
    });
  } catch (error) {
    console.error("Add member error:", error);
    res.status(500).json({
      error: "Server error",
      message: error.message || "Failed to add member to project",
    });
  }
});
// Get single project with tasks
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      
      .populate("members.user", "name email avatarColor");

    if (!project) {
      return res.status(404).json({
        error: "Not found",
        message: "Project not found",
      });
    }

    // Check if user has access
    const hasAccess =
      
      project.members.some((m) => m.user._id.equals(req.userId));

    if (!hasAccess) {
      return res.status(403).json({
        error: "Access denied",
        message: "You do not have access to this project",
      });
    }

    // Get project tasks
    const tasks = await Task.find({ project: project._id })
      .populate("assignedTo", "name email avatarColor")
      
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      project,
      tasks,
      taskCount: tasks.length,
    });
  } catch (error) {
    console.error("Get project error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Failed to fetch project",
    });
  }
});

// Update project
router.put("/:id", async (req, res) => {
  try {
    const { name, description, status } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        error: "Not found",
        message: "Project not found",
      });
    }

    // Check permissions 
    const isAdminMember = project.members.some(
      (m) => m.user.equals(req.userId) && m.role === "admin"
    );

    if (!isAdminMember) {
      return res.status(403).json({
        error: "Access denied",
        message: "Only project admins can update projects",
      });
    }

    // Update fields
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;

    await project.save();
    
    await project.populate("members.user", "name email avatarColor");

    res.json({
      success: true,
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Failed to update project",
    });
  }
});

// Delete project
router.delete("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        error: "Not found",
        message: "Project not found",
      });
    }

   

    // Delete all tasks in this project
    await Task.deleteMany({ project: project._id });

    // Delete the project
    await Project.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Failed to delete project",
    });
  }
});
// Get project members
router.get("/:id/members", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      "members.user",
      "name email role avatarColor"
    );

    if (!project) {
      return res.status(404).json({
        error: "Not found",
        message: "Project not found",
      });
    }

    // Check if user has access
    const hasAccess =
      
      project.members.some((m) => m.user._id.equals(req.userId));

    if (!hasAccess) {
      return res.status(403).json({
        error: "Access denied",
        message: "You do not have access to this project",
      });
    }

    // Format members data
    const members = project.members.map((member) => ({
      ...member.user.toObject(),
      role: member.role,
      joinedAt: member.joinedAt,
    }));

    res.json({
      success: true,
      members,
    });
  } catch (error) {
    console.error("Get project members error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Failed to fetch project members",
    });
  }
});

// Remove member from project
router.delete("/:projectId/members/:userId", async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        error: "Not found",
        message: "Project not found",
      });
    }

    // Check if user is a member
    const memberExists = project.members.some(
      (m) => m.user.toString() === userId
    );

    if (!memberExists) {
      return res.status(404).json({
        error: "Not found",
        message: "User is not a member of this project",
      });
    }

    // Remove member
    project.members = project.members.filter(
      (m) => m.user.toString() !== userId
    );

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
