import React, { createContext, useState, useContext } from "react";

const UserContext = createContext();

export const useUsers = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUsers must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  // Your mock users - these are static, no API calls
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

  const [users] = useState(mockUsers); // Static list, never changes

  // Function to add user to project (just updates project in database)
  const addUserToProject = async (projectId, userId, role = "member") => {
    try {
      console.log(`Adding mock user ${userId} to project ${projectId}`);

      // Call backend to update project with this user
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add user to project");
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error adding user to project:", error);
      return {
        success: false,
        error: error.message || "Failed to add user to project",
      };
    }
  };

  // Helper function to get user by ID
  const getUserById = (userId) => {
    return mockUsers.find((user) => user._id === userId);
  };

  // Get users not in a project (for dropdowns)
  const getAvailableUsersForProject = (currentProjectMembers = []) => {
    const memberIds = currentProjectMembers.map(
      (member) => member.userId || member.user
    );
    return mockUsers.filter((user) => !memberIds.includes(user._id));
  };

  const value = {
    users: mockUsers, // Always return mock users
    getUserById,
    addUserToProject,
    getAvailableUsersForProject,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
