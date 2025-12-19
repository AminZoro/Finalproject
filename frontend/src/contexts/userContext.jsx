import React, { createContext, useContext, useState } from "react";

const UserContext = createContext();

export const useUsers = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUsers must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  // Your 5 mock users - static, never changes
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

  const [users] = useState(mockUsers);

  // Function to add mock user to project
  const addUserToProject = async (projectId, userId, role = "member") => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/projects/${projectId}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add user");
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error:", error);
      return { success: false, error: error.message };
    }
  };

  // Helper functions
  const getUserById = (userId) => {
    return mockUsers.find((user) => user._id === userId);
  };

  const value = {
    users: mockUsers,
    getUserById,
    addUserToProject,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
