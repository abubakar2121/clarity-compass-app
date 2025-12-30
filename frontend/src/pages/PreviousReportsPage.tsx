"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Report, AuthUser } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

const PreviousReportsPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated || !user) {
            toast.error("You need to be logged in to view reports.");
            navigate("/login");
            return;
        }

        const fetchReports = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/reports/user/${user.id}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch reports");
                }
                const data = await response.json();
                setReports(data);
            } catch (error) {
                toast.error("Could not fetch your reports. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchReports();
    }, [navigate, isAuthenticated, user]);

    const handleViewReport = (report: Report) => {
        // Store the selected report and navigate to the report page
        localStorage.setItem("founderClarityReport", JSON.stringify(report));
        const session = { user_id: user?.id, session_id: report.session_id };
        localStorage.setItem("founderClaritySession", JSON.stringify(session));
        navigate(`/report/${report.id}`);
    };
    
    const handleGoHome = () => {
        navigate("/");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
                <p className="text-lg">Loading your reports...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center bg-background text-foreground p-4 relative">
            <div className="absolute top-4 right-4 flex items-center space-x-2">
                {isAuthenticated && (
                    <Button variant="outline" onClick={logout} className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
                        Logout
                    </Button>
                )}
                <ThemeToggle />
            </div>
            <Card className="w-full max-w-4xl bg-card border-border text-card-foreground shadow-lg mt-20">
                <CardHeader className="text-center">
                    <CardTitle className="text-4xl font-bold text-primary">
                        Your Previous Reports
                    </CardTitle>
                    <CardDescription className="text-muted-foreground mt-2 text-lg">
                        Here are the reports you've generated.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {reports.length > 0 ? (
                        <ul className="space-y-4">
                            {reports.map((report) => (
                                <li key={report.id} className="border p-4 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{report.mindset_shift}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Generated on: {new Date(report.generated_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Button onClick={() => handleViewReport(report)}>View Report</Button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-muted-foreground">You have no reports yet.</p>
                    )}
                     <div className="flex justify-center mt-6">
                        <Button
                            onClick={handleGoHome}
                            variant="outline"
                            className="w-full max-w-xs bg-secondary border-border text-secondary-foreground hover:bg-secondary/80 text-lg py-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105"
                        >
                            Return to Home
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PreviousReportsPage;