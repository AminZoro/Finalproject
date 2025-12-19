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
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const projectsRes = await api.get("/projects");
      
      setProjects(projectsRes.data.projects || projectsRes.data || []);
    } catch (error) {
      console.error("Error loading projects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };
  const createProject = async (newProjectName, description = "") => {
    try {
      const response = await api.post("/projects", {
        name: newProjectName,
        description: description || `Project: ${newProjectName}`,
      });

      // Correctly extract the project object from response
      const newProject = response.data.project; 

      // Update state 
      setProjects((prevProjects) => {
        if (!prevProjects) return [newProject];
        return [newProject, ...prevProjects];
      });

      return newProject;
    } catch (error) {
      console.error("Failed to create project:", error);
      throw error;
    }
  };
  const value = { projects, createProject };
  return (
    <ProjectContext.Provider
      value={{
        projects,
        setProjects, 
        createProject,
        
      }}
    >
      {children}
      {/* Create Task Modal */}
    </ProjectContext.Provider>
  );
};
