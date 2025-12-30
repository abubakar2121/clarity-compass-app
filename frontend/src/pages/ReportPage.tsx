"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Report, AuthUser } from "@/lib/types"; // Changed User to AuthUser
import { trackEvent } from "@/utils/tracking-mock";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/context/AuthContext"; // Import useAuth

const ReportPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth(); // Get user from AuthContext
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      toast.error("You need to be logged in to view a report.");
      navigate("/login");
      return;
    }

    const storedReport = localStorage.getItem("founderClarityReport");
    if (storedReport) {
      const parsedReport: Report = JSON.parse(storedReport);
      setReport(parsedReport);
    } else {
      toast.error("No report found. Please complete the diagnostic.");
      navigate("/diagnostic");
    }
  }, [navigate, isAuthenticated, user]);

  const handleGoHome = () => {
    // Clear local storage for a fresh start of a new diagnostic, but keep auth
    localStorage.removeItem("founderClaritySessionId");
    localStorage.removeItem("founderClarityReport");
    localStorage.removeItem("founderClaritySession");
    navigate("/");
  };

  const handleCTAClick = () => {
    if (report && user) {
      trackEvent("cta_click", user.id, report.session_id, {
        reportId: report.id,
      });
    }
  };

  if (!report || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <p className="text-lg">Loading your report...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 relative">
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        {isAuthenticated && (
          <Button variant="outline" onClick={logout} className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
            Logout
          </Button>
        )}
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-2xl bg-card border-border text-card-foreground shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold text-primary">
            Your Personalized Report
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2 text-lg">
            Hello {user.name}, here are your insights!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 text-center">
          <div className="text-left space-y-4">
            <h3 className="text-2xl font-semibold text-primary">Your Top Mindset Shift:</h3>
            <p className="text-foreground text-lg leading-relaxed">
              <span className="font-medium">{report.mindset_shift}</span>
            </p>
            <p className="text-muted-foreground text-md italic mt-1">
              *Insight:* {report.mindset_shift_insight}
            </p>

            <h3 className="text-2xl font-semibold text-accent-foreground mt-6">Your Top Operational Focus:</h3>
            <p className="text-foreground text-lg leading-relaxed">
              <span className="font-medium">{report.operational_focus}</span>
            </p>
            <p className="text-muted-foreground text-md italic mt-1">
              *Insight:* {report.operational_focus_insight}
            </p>

            <h3 className="text-2xl font-semibold text-green-500 mt-6">Your Suggested Next Move:</h3>
            <p className="text-foreground text-lg leading-relaxed">
              <span className="font-medium">{report.next_move.type}</span> - {report.next_move.description}
            </p>
            {report.next_move.details && (
              <p className="text-muted-foreground text-md italic mt-2">
                Details: {report.next_move.details}
              </p>
            )}
          </div>


          <p className="text-sm text-muted-foreground mt-4">
            You'll also receive this report in your email at {user.email}.
            <br />
            Insights are directional, not prescriptive. Your data is private and used respectfully.
          </p>

          <Button
            onClick={handleGoHome}
            variant="outline"
            className="w-full max-w-xs bg-secondary border-border text-secondary-foreground hover:bg-secondary/80 text-lg py-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            Return to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportPage;