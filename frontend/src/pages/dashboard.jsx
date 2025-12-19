import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/authContext.jsx";
import api from "../services/api.js";
import { useProjects } from "../contexts/projectContext.jsx";
import { useUsers } from "../contexts/userContext.jsx";
// create components for each function
//one api to return the users,tasks and
const Dashboard = () => {
  const { user, logout } = useAuth();
  const { projects, setProjects, createProject } = useProjects();
  console.log(projects);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([
    {
      _id: "1",
      name: "John Doe",
      email: "john@teamflow.com",
      role: "admin",
      avatarColor: "bg-blue-500",
    },
    {
      _id: "2",
      name: "Selena Kyle",
      email: "Selena@teamflow.com",
      role: "project_manager",
      avatarColor: "bg-green-500",
    },
    {
      _id: "3",
      name: "Alex Mason",
      email: "alex@teamflow.com",
      role: "member",
      avatarColor: "bg-purple-500",
    },
    {
      _id: "4",
      name: "Maria Garcia",
      email: "maria@teamflow.com",
      role: "member",
      avatarColor: "bg-pink-500",
    },
    {
      _id: "5",
      name: "David Wilson",
      email: "david@teamflow.com",
      role: "member",
      avatarColor: "bg-yellow-500",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  // Modals
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false); //ShowuserModal

  // Forms
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    project: "",
    assignedTo: "",
    priority: "medium",
    dueDate: "",
  });
  const [newMemberId, setNewMemberId] = useState("");
  const [projectMembers, setProjectMembers] = useState([]);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "password123", // Default password
    role: "member",
    avatarColor: "bg-blue-500",
    assignToProject: selectedProject?._id || "", // Auto-fill if from project modal
    createTask: false,
    taskTitle: "",
    taskDescription: "",
  });

  // Load all data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projectsRes, tasksRes, usersRes] = await Promise.all([
        api.get("/projects"),
        api.get("/tasks/my-tasks"),
        api.get("/users"),
      ]);

      // Safely extract the tasks array
      const tasksData = Array.isArray(tasksRes.data)
        ? tasksRes.data
        : tasksRes.data.tasks ||
          tasksRes.data.myTasks ||
          tasksRes.data.data ||
          [];

      setTasks(tasksData);
      console.log("Tasks state set to:", tasksData);
      // Handle users response
      const usersData = usersRes.data.users || usersRes.data;
      setUsers(Array.isArray(usersData) ? usersData : []);

      console.log("Loaded tasks:", tasksData);
      console.log("Loaded users:", usersData);
    } catch (error) {
      console.error("Error loading data:", error);
      setTasks([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectMembers = async (projectId) => {
    try {
      const response = await api.get(`/users/project/${projectId}`);
      // The response is an array of users with role and joinedAt
      const membersData = Array.isArray(response.data)
        ? response.data
        : response.data.members || [];

      // Transform to consistent format
      const formattedMembers = membersData.map((member) => ({
        userId: member._id, // Add userId for consistency
        ...member,
      }));

      setProjectMembers(formattedMembers);
      console.log("Loaded project members:", formattedMembers);
    } catch (error) {
      console.error("Error loading project members:", error);
      setProjectMembers([]);
    }
  };

  // Project Functions
  // Add User Function (Create + Assign)
  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!newUser.name.trim() || !newUser.email.trim()) {
      alert("Name and email are required!");
      return;
    }

    try {
      // 1. Create the user
      const userResponse = await api.post("/auth/register", {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        avatarColor: newUser.avatarColor,
      });

      const newUserId = userResponse.data.user._id;

      // 2. Refresh users list
      const usersRes = await api.get("/users");
      setUsers(usersRes.data.users || usersRes.data);

      // 3. If project is selected, assign user to it
      let assignedToProject = false;
      if (newUser.assignToProject) {
        try {
          await api.post(`/projects/${newUser.assignToProject}/members`, {
            userId: newUserId,
            role: newUser.role,
          });
          assignedToProject = true;
        } catch (projectError) {
          console.warn("Could not assign to project:", projectError);
        }
      }

      // 4. If task creation is enabled, create task
      let taskCreated = false;
      if (
        newUser.createTask &&
        newUser.taskTitle.trim() &&
        newUser.assignToProject
      ) {
        try {
          await api.post("/tasks", {
            title: newUser.taskTitle,
            description: newUser.taskDescription || `Task for ${newUser.name}`,
            project: newUser.assignToProject,
            assignedTo: newUserId,
            priority: "medium",
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
          });
          taskCreated = true;
        } catch (taskError) {
          console.warn("Could not create task:", taskError);
        }
      }

      // 5. Reset form and show success message
      setNewUser({
        name: "",
        email: "",
        password: "password123",
        role: "member",
        avatarColor: "bg-blue-500",
        assignToProject: "",
        createTask: false,
        taskTitle: "",
        taskDescription: "",
      });
      setShowCreateUserModal(false);

      // Show success message with details
      let message = `User "${newUser.name}" created successfully!`;
      if (assignedToProject) {
        const project = projects.find((p) => p._id === newUser.assignToProject);
        message += `\n✓ Assigned to project: ${project?.name || "Project"}`;
      }
      if (taskCreated) {
        message += `\n✓ Task "${newUser.taskTitle}" created and assigned`;
      }

      alert(message);
    } catch (error) {
      console.error("Error creating user:", error);
      alert(error.response?.data?.message || "Failed to create user");
    }
  };
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      // Let context handle the update
      await createProject(newProjectName);

      setNewProjectName("");
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project");
    }
  };

  const handleViewProjectDetails = async (project) => {
    setSelectedProject(project);
    setShowProjectModal(true);
    await loadProjectMembers(project._id);
  };

  const handleDeleteProject = async (projectId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this project? All tasks in this project will be deleted too."
      )
    ) {
      try {
        await api.delete(`/projects/${projectId}`);
        setProjects(projects.filter((p) => p._id !== projectId));
        setTasks(tasks.filter((t) => t.project !== projectId));
        setShowProjectModal(false);
        alert("Project deleted successfully!");
      } catch (error) {
        console.error("Error deleting project:", error);
        alert("Failed to delete project");
      }
    }
  };

  // Task Functions
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim() || !newTask.project) return;

    try {
      const response = await api.post("/tasks", newTask);
      setTasks([response.data, ...tasks]);

      // Reset form
      setNewTask({
        title: "",
        description: "",
        project: "",
        assignedTo: "",
        priority: "medium",
        dueDate: "",
      });
      setShowTaskModal(false);

      alert("Task created successfully!");
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task");
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });

      // Update local state
      setTasks(
        tasks.map((task) =>
          task._id === taskId ? { ...task, status: newStatus } : task
        )
      );
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task status");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await api.delete(`/tasks/${taskId}`);
        setTasks(tasks.filter((t) => t._id !== taskId));
        alert("Task deleted successfully!");
      } catch (error) {
        console.error("Error deleting task:", error);
        alert("Failed to delete task");
      }
    }
  };

  const handleAddMemberToProject = async () => {
    if (!selectedProject || !newMemberId) {
      alert("Please select a user to add");
      return;
    }

    if (newMemberId.length !== 24) {
      alert("Invalid user selected. Please refresh and try again.");
      return;
    }

    try {
      const res = await api.post(`/projects/${selectedProject._id}/members`, {
        userId: newMemberId,
        role: "member",
      });

      const newMember = res.data.member;

      // UPDATE DASHBOARD PROJECT LIST
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project._id === selectedProject._id
            ? {
                ...project,
                members: [
                  ...(project.members || []),
                  {
                    user: {
                      _id: newMember.userId,
                      name: newMember.name,
                      email: newMember.email,
                      avatarColor: newMember.avatarColor,
                    },
                    role: newMember.role,
                    joinedAt: newMember.joinedAt,
                  },
                ],
              }
            : project
        )
      );

      // UPDATE SELECTED PROJECT
      setSelectedProject((prev) => ({
        ...prev,
        members: [
          ...(prev.members || []),
          {
            user: {
              _id: newMember.userId,
              name: newMember.name,
              email: newMember.email,
              avatarColor: newMember.avatarColor,
            },
            role: newMember.role,
            joinedAt: newMember.joinedAt,
          },
        ],
      }));

      await loadProjectMembers(selectedProject._id);
      setNewMemberId("");
      alert("Member added successfully!");
    } catch (error) {
      console.error("Error adding member:", error);
      const errorMsg = error.response?.data?.message || "Failed to add member";
      alert(errorMsg);
    }
  };

  const handleRemoveMemberFromProject = async (userId) => {
    if (!selectedProject || !userId) return;

    if (!window.confirm("Are you sure you want to remove this member?")) return;

    try {
      const res = await fetch(
        `http://localhost:8080/api/projects/${selectedProject._id}/members/${userId}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Failed to remove member");

      // UPDATE DASHBOARD PROJECT LIST
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project._id === selectedProject._id
            ? {
                ...project,
                members: project.members.filter((m) => m.user._id !== userId),
              }
            : project
        )
      );

      // Update selected project as well
      setSelectedProject((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.user._id !== userId),
      }));

      await loadProjectMembers(selectedProject._id);
    } catch (err) {
      console.error(err);
      alert("Failed to remove member");
    }
  };

  // Helper functions
  const getAssignedUserName = (task) => {
    if (!task.assignedTo) return "Unassigned";
    const assignedUser = users.find((u) => u._id === task.assignedTo);
    return assignedUser ? assignedUser.name : "Unknown User";
  };

  const getAssignedUser = (userId) => {
    return users.find((u) => u._id === userId);
  };

  // Filter tasks by status
  const todoTasks = tasks.filter((task) => task.status === "todo");
  const inProgressTasks = tasks.filter((task) => task.status === "in_progress");
  const doneTasks = tasks.filter((task) => task.status === "done");

  // Get tasks for selected project
  const selectedProjectTasks = selectedProject
    ? tasks.filter((task) => task.project === selectedProject._id)
    : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            TeamFlow Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden md:block">
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-gray-600 mt-2">
            Manage your team projects and tasks efficiently.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Total Projects
            </h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {projects.length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">Total Tasks</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {tasks.length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Team Members
            </h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {users.length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Completion Rate
            </h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {tasks.length > 0
                ? Math.round((doneTasks.length / tasks.length) * 100)
                : 0}
              %
            </p>
          </div>
        </div>

        {/* Create Project Form */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Create New Project
          </h2>
          <form onSubmit={handleCreateProject} className="flex gap-4">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Enter project name"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition"
            >
              Create Project
            </button>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mb-8">
          <button
            onClick={() => setShowTaskModal(true)}
            className="flex items-center bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2.5 rounded-lg transition"
          >
            <span className="mr-2">+</span>
            Create New Task
          </button>
        </div>

        {/* Task Board */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Task Board</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* To Do Column */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-red-600">
                  To Do ({todoTasks.length})
                </h3>
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                  Pending
                </span>
              </div>
              {todoTasks.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No tasks to do</p>
              ) : (
                todoTasks.map((task) => {
                  const assignedUser = getAssignedUser(task.assignedTo);
                  return (
                    <div
                      key={task._id}
                      className="bg-red-50 border border-red-100 rounded-lg p-4 mb-3 hover:shadow-sm transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {task.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {task.description}
                          </p>

                          {/* Assigned User */}
                          <div className="flex items-center mt-2">
                            {assignedUser ? (
                              <>
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${
                                    assignedUser.avatarColor || "bg-blue-500"
                                  }`}
                                >
                                  {assignedUser.name.charAt(0)}
                                </div>
                                <span className="text-xs text-gray-600 ml-2">
                                  Assigned to: {assignedUser.name}
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-gray-500">
                                Unassigned
                              </span>
                            )}
                          </div>

                          {/* Priority */}
                          <div className="flex items-center mt-2">
                            <span
                              className={`text-xs font-medium px-2 py-1 rounded ${
                                task.priority === "high"
                                  ? "bg-red-100 text-red-800"
                                  : task.priority === "medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {task.priority} priority
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2 ml-3">
                          <button
                            onClick={() =>
                              handleUpdateTaskStatus(task._id, "in_progress")
                            }
                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded transition"
                          >
                            Start
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-1 rounded transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* In Progress Column */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-yellow-600">
                  In Progress ({inProgressTasks.length})
                </h3>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
                  Active
                </span>
              </div>
              {inProgressTasks.length === 0 ? (
                <p className="text-gray-400 text-center py-4">
                  No tasks in progress
                </p>
              ) : (
                inProgressTasks.map((task) => {
                  const assignedUser = getAssignedUser(task.assignedTo);
                  return (
                    <div
                      key={task._id}
                      className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-3 hover:shadow-sm transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {task.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {task.description}
                          </p>

                          {/* Assigned User */}
                          {assignedUser && (
                            <div className="flex items-center mt-2">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${
                                  assignedUser.avatarColor || "bg-blue-500"
                                }`}
                              >
                                {assignedUser.name.charAt(0)}
                              </div>
                              <span className="text-xs text-gray-600 ml-2">
                                {assignedUser.name}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col space-y-2 ml-3">
                          <button
                            onClick={() =>
                              handleUpdateTaskStatus(task._id, "done")
                            }
                            className="bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-1 rounded transition"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-1 rounded transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Done Column */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-green-600">
                  Done ({doneTasks.length})
                </h3>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                  Completed
                </span>
              </div>
              {doneTasks.length === 0 ? (
                <p className="text-gray-400 text-center py-4">
                  No completed tasks
                </p>
              ) : (
                doneTasks.map((task) => {
                  const assignedUser = getAssignedUser(task.assignedTo);
                  return (
                    <div
                      key={task._id}
                      className="bg-green-50 border border-green-100 rounded-lg p-4 mb-3 hover:shadow-sm transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {task.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {task.description}
                          </p>

                          {/* Assigned User */}
                          {assignedUser && (
                            <div className="flex items-center mt-2">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${
                                  assignedUser.avatarColor || "bg-blue-500"
                                }`}
                              >
                                {assignedUser.name.charAt(0)}
                              </div>
                              <span className="text-xs text-gray-600 ml-2">
                                Completed by: {assignedUser.name}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center mt-2">
                            <span className="text-xs text-green-600 font-medium">
                              ✓ Completed
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2 ml-3">
                          <button
                            onClick={() =>
                              handleUpdateTaskStatus(task._id, "todo")
                            }
                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded transition"
                          >
                            Re-open
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-1 rounded transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Projects List */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Your Projects</h2>
            <span className="text-sm text-gray-500">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </span>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📂</div>
              <p className="text-gray-500 text-lg">No projects yet</p>
              <p className="text-gray-400 mt-2">
                Create your first project above!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                // Count tasks for this project
                const projectTaskCount = tasks.filter(
                  (task) => task.project === project._id
                ).length;

                // Use the correct property to get member IDs
                const projectMemberIds =
                  project.members?.map(
                    (m) => m.user?._id || m.user || m.userId
                  ) || [];
                const projectMemberCount = projectMemberIds.length;

                const projectTodoCount = tasks.filter(
                  (task) =>
                    task.project === project._id && task.status === "todo"
                ).length;
                const projectDoneCount = tasks.filter(
                  (task) =>
                    task.project === project._id && task.status === "done"
                ).length;

                // Get project members

                return (
                  <div
                    key={project._id}
                    className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition hover:border-blue-300"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-lg text-gray-900 truncate">
                        {project.name}
                      </h3>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          project.status === "active"
                            ? "bg-green-100 text-green-800"
                            : project.status === "planning"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-500">
                          Tasks: {projectTaskCount}
                        </span>
                        {projectTodoCount > 0 && (
                          <span className="text-red-600 font-medium">
                            {projectTodoCount} to do
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${
                              (projectDoneCount /
                                Math.max(projectTaskCount, 1)) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{projectDoneCount} done</span>
                        <span>
                          {Math.round(
                            (projectDoneCount / Math.max(projectTaskCount, 1)) *
                              100
                          )}
                          %
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">👥</span>
                        <span>
                          {projectMemberCount} member
                          {projectMemberCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <button
                        onClick={() => handleViewProjectDetails(project)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                      >
                        View Details
                        <span className="ml-1">→</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Team Members Section */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
            <span className="text-sm text-gray-500">
              {users.length} member{users.length !== 1 ? "s" : ""}
            </span>
          </div>

          {users.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No team members</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user) => {
                // Check membership correctly
                const isAlreadyMember = projectMembers.some(
                  (member) => (member.userId || member._id) === user._id
                );

                // Count tasks assigned to this user
                const userTaskCount = tasks.filter(
                  (task) => task.assignedTo === user._id
                ).length;
                const userTodoCount = tasks.filter(
                  (task) =>
                    task.assignedTo === user._id && task.status === "todo"
                ).length;
                const userDoneCount = tasks.filter(
                  (task) =>
                    task.assignedTo === user._id && task.status === "done"
                ).length;

                // Count projects this user is a member of
                const userProjectCount = projects.filter((project) =>
                  project.members?.some((member) => member.userId === user._id)
                ).length;

                return (
                  <div
                    key={user._id}
                    className={`flex items-center text-sm p-2 rounded ${
                      isAlreadyMember ? "bg-green-50" : ""
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg ${
                          user.avatarColor || "bg-blue-500"
                        }`}
                      >
                        {user.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <h3 className="font-bold text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500 capitalize">
                          {user.role}
                        </p>
                      </div>
                    </div>

                    {/* <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="text-sm text-gray-600">Projects</p>
                        <p className="font-semibold text-blue-700">
                          {userProjectCount}
                        </p>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <p className="text-sm text-gray-600">Tasks</p>
                        <p className="font-semibold text-green-700">
                          {userTaskCount}
                        </p>
                      </div>
                    </div> */}

                    {/* <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-1">Task Status:</p>
                      <div className="flex items-center text-xs">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span>To Do: {userTodoCount}</span>
                            <span>Done: {userDoneCount}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-green-500 h-1.5 rounded-full"
                              style={{
                                width: `${
                                  (userDoneCount / Math.max(userTaskCount, 1)) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div> */}

                    {/* <div className="mt-4">
                      <p className="text-xs text-gray-500">Current Tasks:</p>
                      <ul className="text-xs text-gray-600 mt-1 space-y-1">
                        {tasks
                          .filter(
                            (task) =>
                              task.assignedTo === user._id &&
                              task.status !== "done"
                          )
                          .slice(0, 3)
                          .map((task) => (
                            <li key={task._id} className="flex items-center">
                              <span
                                className={`w-2 h-2 rounded-full mr-2 ${
                                  task.status === "todo"
                                    ? "bg-red-500"
                                    : task.status === "in_progress"
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                              ></span>
                              <span className="truncate">{task.title}</span>
                            </li>
                          ))}
                        {tasks.filter(
                          (task) =>
                            task.assignedTo === user._id &&
                            task.status !== "done"
                        ).length === 0 && (
                          <li className="text-gray-400">No active tasks</li>
                        )}
                      </ul>
                    </div> */}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* MODALS */}

      {/* Project Details Modal */}
      {showProjectModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedProject.name}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {selectedProject.description}
                  </p>
                </div>
                <button
                  onClick={() => setShowProjectModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold text-blue-700 capitalize">
                    {selectedProject.status}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Tasks</p>
                  <p className="font-semibold text-green-700">
                    {selectedProjectTasks.length}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">To Do</p>
                  <p className="font-semibold text-yellow-700">
                    {
                      selectedProjectTasks.filter((t) => t.status === "todo")
                        .length
                    }
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Completion</p>
                  <p className="font-semibold text-purple-700">
                    {Math.round(
                      (selectedProjectTasks.filter((t) => t.status === "done")
                        .length /
                        Math.max(selectedProjectTasks.length, 1)) *
                        100
                    )}
                    %
                  </p>
                </div>
              </div>

              {/* Project Members Section */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Team Members
                  </h3>
                  <button
                    onClick={() => setShowUserManagement(true)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Member
                  </button>
                </div>

                {projectMembers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No members added yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {projectMembers.map((member) => {
                      // member already has all user properties at the top level
                      const userId = member.userId || member._id;

                      return (
                        <div
                          key={userId}
                          className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                                member.avatarColor || "bg-blue-500"
                              }`}
                            >
                              {member.name.charAt(0)}
                            </div>
                            <div className="ml-3">
                              <p className="font-medium text-gray-900">
                                {member.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {member.role} • {member.email}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              handleRemoveMemberFromProject(userId)
                            }
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Project Tasks
                  </h3>
                  <span className="text-sm text-gray-500">
                    {selectedProjectTasks.length} task
                    {selectedProjectTasks.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {selectedProjectTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-3">📝</div>
                    <p className="text-gray-500">
                      No tasks yet for this project
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Add tasks to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedProjectTasks.map((task) => {
                      const assignedUser = getAssignedUser(task.assignedTo);
                      return (
                        <div
                          key={task._id}
                          className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 p-4 rounded-lg transition"
                        >
                          <div className="flex-1">
                            <div className="flex items-center">
                              <p className="font-medium">{task.title}</p>
                              <span
                                className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${
                                  task.status === "todo"
                                    ? "bg-red-100 text-red-800"
                                    : task.status === "in_progress"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {task.status.replace("_", " ")}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {task.description}
                            </p>
                            <div className="flex items-center mt-2 space-x-3">
                              {assignedUser && (
                                <div className="flex items-center">
                                  <div
                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${
                                      assignedUser.avatarColor || "bg-blue-500"
                                    }`}
                                  >
                                    {assignedUser.name.charAt(0)}
                                  </div>
                                  <span className="text-xs text-gray-600 ml-1">
                                    {assignedUser.name}
                                  </span>
                                </div>
                              )}
                              <span
                                className={`text-xs font-medium px-2 py-1 rounded ${
                                  task.priority === "high"
                                    ? "bg-red-100 text-red-800"
                                    : task.priority === "medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {task.priority} priority
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => {
                                if (task.status === "todo") {
                                  handleUpdateTaskStatus(
                                    task._id,
                                    "in_progress"
                                  );
                                } else if (task.status === "in_progress") {
                                  handleUpdateTaskStatus(task._id, "done");
                                } else {
                                  handleUpdateTaskStatus(task._id, "todo");
                                }
                                setShowProjectModal(false);
                                setTimeout(() => {
                                  setSelectedProject(selectedProject);
                                  setShowProjectModal(true);
                                }, 100);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              {task.status === "todo"
                                ? "Start"
                                : task.status === "in_progress"
                                ? "Complete"
                                : "Re-open"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setNewTask({ ...newTask, project: selectedProject._id });
                    setShowTaskModal(true);
                    setShowProjectModal(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  + Add Task to Project
                </button>
                <button
                  onClick={() => handleDeleteProject(selectedProject._id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Create New Task
              </h2>
              <form onSubmit={handleCreateTask}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Task Title *
                    </label>
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) =>
                        setNewTask({ ...newTask, title: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter task title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newTask.description}
                      onChange={(e) =>
                        setNewTask({ ...newTask, description: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Enter task description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project *
                    </label>
                    <select
                      value={newTask.project}
                      onChange={(e) =>
                        setNewTask({ ...newTask, project: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a project</option>
                      {projects.map((project) => (
                        <option key={project._id} value={project._id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assign To
                    </label>
                    <select
                      value={newTask.assignedTo || ""}
                      onChange={(e) =>
                        setNewTask({ ...newTask, assignedTo: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Unassigned</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={newTask.priority}
                        onChange={(e) =>
                          setNewTask({ ...newTask, priority: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) =>
                          setNewTask({ ...newTask, dueDate: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Task
                  </button>
                </div>

                <div className="flex justify-end space-x-4 mb-8">
                  <button
                    onClick={() => setShowTaskModal(true)}
                    className="flex items-center bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2.5 rounded-lg transition"
                  >
                    <span className="mr-2">+</span>
                    Create New Task
                  </button>
                  <button
                    onClick={() => setShowCreateUserModal(true)}
                    className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-medium px-5 py-2.5 rounded-lg transition"
                  >
                    <span className="mr-2">👤</span>
                    Add Team Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* User Management Modal */}
      {showUserManagement && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Add Team Member
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Add members to {selectedProject.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowUserManagement(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User to Add
                </label>
                <select
                  value={newMemberId}
                  onChange={(e) => setNewMemberId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a user...</option>
                  {users
                    .filter((user) => {
                      // Check against the correct property
                      return !projectMembers.some(
                        (member) => (member.userId || member._id) === user._id
                      );
                    })
                    .map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.role}) • {user.email}
                      </option>
                    ))}
                </select>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-gray-900 mb-2">
                  Available Users
                </h4>
                <div className="space-y-2">
                  {users.length === 0 ? (
                    <p className="text-gray-500 text-sm">No users available</p>
                  ) : (
                    users.map((user) => {
                      const isAlreadyMember = projectMembers.some(
                        (member) => member.userId === user._id
                      );
                      return (
                        <div
                          key={user._id}
                          className={`flex items-center text-sm p-2 rounded ${
                            isAlreadyMember ? "bg-green-50" : ""
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${
                              user.avatarColor || "bg-gray-400"
                            }`}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <span className="ml-2">{user.name}</span>
                          <span className="ml-auto text-gray-500">
                            {user.role}
                          </span>
                          {isAlreadyMember && (
                            <span className="ml-2 text-green-600 text-xs">
                              ✓ Member
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowUserManagement(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMemberToProject}
                  disabled={!newMemberId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Member
                </button>
              </div>
              {/* Create User Modal - ADD THIS NEW MODAL */}
              {showCreateUserModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">
                            Add Team Member
                          </h2>
                          <p className="text-gray-600 mt-1">
                            Create new user{" "}
                            {selectedProject
                              ? `for "${selectedProject.name}"`
                              : ""}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setShowCreateUserModal(false);
                            setNewUser({
                              name: "",
                              email: "",
                              password: "password123",
                              role: "member",
                              avatarColor: "bg-blue-500",
                              assignToProject: "",
                              createTask: false,
                              taskTitle: "",
                              taskDescription: "",
                            });
                          }}
                          className="text-gray-400 hover:text-gray-600 text-2xl"
                        >
                          ×
                        </button>
                      </div>

                      <form onSubmit={handleCreateUser}>
                        <div className="space-y-6">
                          {/* Basic User Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name *
                              </label>
                              <input
                                type="text"
                                value={newUser.name}
                                onChange={(e) =>
                                  setNewUser({
                                    ...newUser,
                                    name: e.target.value,
                                  })
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                placeholder="John Doe"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email *
                              </label>
                              <input
                                type="email"
                                value={newUser.email}
                                onChange={(e) =>
                                  setNewUser({
                                    ...newUser,
                                    email: e.target.value,
                                  })
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                placeholder="john@teamflow.com"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                              </label>
                              <input
                                type="text"
                                value={newUser.password}
                                onChange={(e) =>
                                  setNewUser({
                                    ...newUser,
                                    password: e.target.value,
                                  })
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                placeholder="Set a password"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Default: password123
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Role
                              </label>
                              <select
                                value={newUser.role}
                                onChange={(e) =>
                                  setNewUser({
                                    ...newUser,
                                    role: e.target.value,
                                  })
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="member">Team Member</option>
                                <option value="project_manager">
                                  Project Manager
                                </option>
                                <option value="admin">Administrator</option>
                              </select>
                            </div>
                          </div>

                          {/* Avatar Color Selection */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Avatar Color
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {[
                                "bg-blue-500",
                                "bg-red-500",
                                "bg-green-500",
                                "bg-yellow-500",
                                "bg-purple-500",
                                "bg-pink-500",
                                "bg-indigo-500",
                              ].map((color) => (
                                <button
                                  type="button"
                                  key={color}
                                  onClick={() =>
                                    setNewUser({
                                      ...newUser,
                                      avatarColor: color,
                                    })
                                  }
                                  className={`w-10 h-10 rounded-full ${color} border-2 ${
                                    newUser.avatarColor === color
                                      ? "border-black"
                                      : "border-transparent"
                                  } hover:opacity-90`}
                                  title={color
                                    .replace("bg-", "")
                                    .replace("-500", "")}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Project Assignment */}
                          <div className="border-t pt-4">
                            <div className="flex items-center mb-4">
                              <input
                                type="checkbox"
                                id="assignToProject"
                                checked={!!newUser.assignToProject}
                                onChange={(e) =>
                                  setNewUser({
                                    ...newUser,
                                    assignToProject: e.target.checked
                                      ? selectedProject?._id ||
                                        projects[0]?._id ||
                                        ""
                                      : "",
                                  })
                                }
                                className="h-4 w-4 text-blue-600 rounded"
                              />
                              <label
                                htmlFor="assignToProject"
                                className="ml-2 font-medium text-gray-900"
                              >
                                Assign to a project
                              </label>
                            </div>

                            {newUser.assignToProject && (
                              <div className="ml-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Select Project
                                </label>
                                <select
                                  value={newUser.assignToProject}
                                  onChange={(e) =>
                                    setNewUser({
                                      ...newUser,
                                      assignToProject: e.target.value,
                                    })
                                  }
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Choose a project...</option>
                                  {projects.map((project) => (
                                    <option
                                      key={project._id}
                                      value={project._id}
                                    >
                                      {project.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>

                          {/* Task Creation (only if project is selected) */}
                          {newUser.assignToProject && (
                            <div className="border-t pt-4">
                              <div className="flex items-center mb-4">
                                <input
                                  type="checkbox"
                                  id="createTask"
                                  checked={newUser.createTask}
                                  onChange={(e) =>
                                    setNewUser({
                                      ...newUser,
                                      createTask: e.target.checked,
                                    })
                                  }
                                  className="h-4 w-4 text-blue-600 rounded"
                                />
                                <label
                                  htmlFor="createTask"
                                  className="ml-2 font-medium text-gray-900"
                                >
                                  Create an initial task for this member
                                </label>
                              </div>

                              {newUser.createTask && (
                                <div className="ml-6 space-y-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Task Title *
                                    </label>
                                    <input
                                      type="text"
                                      value={newUser.taskTitle}
                                      onChange={(e) =>
                                        setNewUser({
                                          ...newUser,
                                          taskTitle: e.target.value,
                                        })
                                      }
                                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                      placeholder="e.g., Complete onboarding"
                                      required={newUser.createTask}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Task Description
                                    </label>
                                    <textarea
                                      value={newUser.taskDescription}
                                      onChange={(e) =>
                                        setNewUser({
                                          ...newUser,
                                          taskDescription: e.target.value,
                                        })
                                      }
                                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                      rows={3}
                                      placeholder="Describe what needs to be done..."
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => {
                              setShowCreateUserModal(false);
                              setNewUser({
                                name: "",
                                email: "",
                                password: "password123",
                                role: "member",
                                avatarColor: "bg-blue-500",
                                assignToProject: "",
                                createTask: false,
                                taskTitle: "",
                                taskDescription: "",
                              });
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Create User & Assign
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>TeamFlow Dashboard • Complete Project Management System</p>
          <p className="mt-1">
            Projects, Tasks, Team Members - All in one place
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
