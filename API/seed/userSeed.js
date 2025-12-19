const mockUsers = [
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
    email: "selena@teamflow.com",
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
];

const mockProjects = [
  {
    _id: "1",
    name: "Website Redesign",
    description: "Redesign company website",
    status: "active",
    createdBy: "1",
    members: [
      { userId: "1", role: "admin" },
      { userId: "2", role: "member" },
      { userId: "3", role: "member" },
    ],
    createdAt: new Date().toISOString(),
  },
  // ... other projects
];

const mockTasks = [
  {
    _id: "1",
    title: "Design homepage",
    description: "Create new homepage design",
    status: "todo",
    priority: "high",
    project: "1",
    projectName: "Website Redesign",
    assignedTo: "2",
    assignedToName: "Selena Kyle",
    createdBy: "1",
    dueDate: "2024-12-15",
    createdAt: new Date().toISOString(),
  },
  // ... other tasks
];

module.exports = {
  mockUsers,
  mockProjects,
  mockTasks
};