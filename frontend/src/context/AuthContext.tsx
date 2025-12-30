"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { AuthUser, CompanySize } from "@/lib/types";
import { trackEvent } from "@/utils/tracking-mock";
import API_URL from "@/config"; // Assuming API_URL is for backend calls

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, companySize: CompanySize) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    // On mount, check localStorage for existing user session
    const storedUser = localStorage.getItem("founderClarityAuthUser");
    if (storedUser) {
      try {
        const parsedUser: AuthUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Failed to parse stored user data:", error);
        localStorage.removeItem("founderClarityAuthUser");
      }
    }
    setIsLoading(false);
  }, []);


  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: email,
          password: password,
        }),
      });

      if (response.ok) {
        const { access_token } = await response.json();

        // Refetch user data from /me endpoint to get full user profile
        const meResponse = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${access_token}`,
          },
        });

        if (meResponse.ok) {
          const userData = await meResponse.json();
          const loggedInUser: AuthUser = {
            id: userData._id,
            name: userData.fullName,
            email: userData.email,
            companySize: userData.companySize,
          };
          setUser(loggedInUser);
          setIsAuthenticated(true);
          localStorage.setItem("founderClarityAuthUser", JSON.stringify(loggedInUser));
          toast.success("Welcome back, founder!");
          trackEvent("login", loggedInUser.id, undefined, { email: loggedInUser.email });
          navigate("/diagnostic");
        } else {
          throw new Error("Failed to fetch user data after login.");
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || "That didn't quite work — want to try again?");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Something went wrong during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, companySize: CompanySize) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullName: name, email, password, companySize }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Account created! Welcome to the Compass. Please log in.");
        navigate("/login");
      } else {
        toast.error(data.detail || "Couldn't create account. Please try again.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Something went wrong during signup. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
      });
    } catch (error) {
      console.error("Logout error:", error);
      // Still proceed with client-side logout
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("founderClarityAuthUser");
      localStorage.removeItem("founderClaritySessionId"); // Clear any active diagnostic session
      localStorage.removeItem("founderClarityReport"); // Clear any stored report
      localStorage.removeItem("founderClaritySession"); // Clear any stored session
      toast.info("You've been logged out.");
      trackEvent("logout", user?.id); // Track logout if user was defined
      setIsLoading(false);
      navigate("/"); // Redirect to landing page
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};