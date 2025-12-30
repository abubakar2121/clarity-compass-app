import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom"; // Import Link
import { MadeWithDyad } from "@/components/made-with-dyad";
import DisclaimerDialog from "@/components/DisclaimerDialog";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { useAuth } from "@/context/AuthContext"; // Import useAuth

const LandingPage = () => {
  const navigate = useNavigate();
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth(); // Use auth context

  const handleStartDiagnosticClick = () => {
    if (isAuthenticated) {
      setIsDisclaimerOpen(true); // Show disclaimer then go to diagnostic
    } else {
      navigate("/signup"); // Redirect to signup if not authenticated
    }
  };

  const handleConfirmDisclaimer = () => {
    setIsDisclaimerOpen(false);
    navigate("/diagnostic"); // Go directly to diagnostic page
  };

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
      <Card className="w-full max-w-2xl bg-card border-border text-card-foreground shadow-lg mb-8">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold text-primary">
            Founder Clarity Compass
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2 text-lg">
            Gain instant clarity on your leadership mindset and operational blind spots.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-foreground text-md leading-relaxed">
            Founders at growth inflection points often feel stuck and overwhelmed. Whether you're
            an early-stage leader struggling with delegation or a scaling CEO facing leadership
            misalignment, the Clarity Compass helps you uncover:
          </p>
          <ul className="list-disc list-inside text-left mx-auto max-w-md space-y-2 text-foreground">
            <li>The top mindset shift you need to make</li>
            <li>The top operational focus for your stage</li>
            <li>A suggested next move (reflection, consult, or action)</li>
          </ul>
          <p className="text-foreground text-md leading-relaxed">
            The experience is empathetic, supportive, and human, designed to give you sharper
            insight and peace of mind in less than 10 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs mx-auto">
            <Button
              onClick={handleStartDiagnosticClick}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              {isAuthenticated ? "Start New Diagnostic" : "Sign Up to Start"}
            </Button>
            {isAuthenticated && (
              <Button
                onClick={() => navigate("/previous-reports")}
                className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground text-lg py-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105"
              >
                View Previous Reports
              </Button>
            )}
          </div>
          {!isAuthenticated && (
            <p className="text-sm text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Log In
              </Link>
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-4">
            Insights are directional, not prescriptive. Your data is private and used respectfully.
          </p>
        </CardContent>
      </Card>

      <Card className="w-full max-w-2xl bg-card border-border text-card-foreground shadow-lg mb-8">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">
            Common Focus Areas by Company Size
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            Insights from founders like you, showing prevalent operational focuses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnalyticsDashboard />
        </CardContent>
      </Card>

      <MadeWithDyad />

      <DisclaimerDialog
        isOpen={isDisclaimerOpen}
        onOpenChange={setIsDisclaimerOpen}
        onConfirm={handleConfirmDisclaimer}
      />
    </div>
  );
};

export default LandingPage;