import React, { createContext, useState, useContext, useEffect } from "react";
import api from "../services/api.js";

const ProjectContext = createContext();

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsRes] = await Promise.all([api.get("/projects")]);
      console.log(projectsRes.data);
      setProjects(projectsRes.data.projects);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };
  const createProject = async (newProjectName) => {
    const response = await api.post("/projects", {
      name: newProjectName,
      description: `Project: ${newProjectName}`,
    });

    setProjects([response.data, ...projects]);
  };
  const value = { projects, createProject };
  return (
    <ProjectContext.Provider value={value}>
      {children}
      {/* Create Task Modal */}
    </ProjectContext.Provider>
  );
};
