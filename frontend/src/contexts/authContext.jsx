import React, { createContext, useState, useContext, useEffect } from "react";
import api from "../services/api.js";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dummyModal, setDummyModal] = useState(false);

  const toggleDummyModal = ()=>{setDummyModal(!dummyModal)};
  
  useEffect(() => {
    // Simulate checking for stored auth
    setTimeout(() => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        role: "admin",
      };

      
      setUser(null); 
      setLoading(false);
    }, 1000);
  }, []);

  
  const login = async (email, password) => {
    console.log("login called with:", email);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    
    const mockUser = {
      id: "1",
      email: email,
      name: email.split("@")[0], // Extract name from email
      role: "member",
    };

    const mockToken = "mock-jwt-token-123456";

    localStorage.setItem("token", mockToken);
    localStorage.setItem("user", JSON.stringify(mockUser));

    setUser(mockUser);
    setToken(mockToken);

    return { success: true };
  };

  //  registration
  const register = async (name, email, password) => {
    console.log("register called:", name, email);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockUser = {
      id: "2",
      email: email,
      name: name,
      role: "member",
    };

    const mockToken = "mock-jwt-token-789012";

    localStorage.setItem("token", mockToken);
    localStorage.setItem("user", JSON.stringify(mockUser));

    setUser(mockUser);
    setToken(mockToken);

    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    toggleDummyModal,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Create Task Modal */}
      {dummyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Create New Task
              </h2>
            
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
