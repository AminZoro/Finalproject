const express = require("express");
const { authenticate } = require("../middleware/auth");
const Task = require("../models/task");
const Project = require("../models/project");

const router = express.Router();

// router.use(authenticate);

// Get user's tasks
router.get("/my-tasks", async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.userId })
      .populate("project", "name")
      .populate("assignedTo", "name email avatarColor")
      .populate("createdBy", "name email avatarColor")
      .sort({ dueDate: 1, createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get tasks for project
router.get("/project/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check if user has access to project
    const hasAccess =
      project.createdBy.toString() === req.userId ||
      project.members.some((m) => m.user.toString() === req.userId);

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    const tasks = await Task.find({ project: projectId })
      .populate("assignedTo", "name email avatarColor")
      .populate("createdBy", "name email avatarColor")
      .sort({ dueDate: 1, createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching project tasks:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Create task
router.post("/", async (req, res) => {
  try {
    const { title, description, project, assignedTo, priority, dueDate } =
      req.body;

    // Check project access
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ error: "Project not found" });
    }

    const hasAccess =
      projectDoc.createdBy.toString() === req.userId ||
      projectDoc.members.some((m) => m.user.toString() === req.userId);

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    const task = new Task({
      title,
      description,
      project,
      assignedTo,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdBy: req.userId,
    });

    await task.save();

    // Populate fields
    await task.populate("assignedTo", "name email avatarColor");
    await task.populate("createdBy", "name email avatarColor");
    await task.populate("project", "name");

    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update task status
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check project access
    const project = await Project.findById(task.project);
    const hasAccess =
      project?.createdBy.toString() === req.userId ||
      project?.members.some((m) => m.user.toString() === req.userId) ||
      task.assignedTo?.toString() === req.userId;

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    task.status = status;
    await task.save();

    await task.populate("assignedTo", "name email avatarColor");
    await task.populate("createdBy", "name email avatarColor");
    await task.populate("project", "name");

    res.json(task);
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update task
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assignedTo, priority, dueDate } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check project access
    const project = await Project.findById(task.project);
    const hasAccess =
      project?.createdBy.toString() === req.userId ||
      project?.members.some((m) => m.user.toString() === req.userId);

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Update fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined)
      task.dueDate = dueDate ? new Date(dueDate) : null;

    await task.save();

    await task.populate("assignedTo", "name email avatarColor");
    await task.populate("createdBy", "name email avatarColor");
    await task.populate("project", "name");

    res.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete task
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check project access
    const project = await Project.findById(task.project);
    const hasAccess =
      project?.createdBy.toString() === req.userId ||
      project?.members.some((m) => m.user.toString() === req.userId);

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    await Task.findByIdAndDelete(id);

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
