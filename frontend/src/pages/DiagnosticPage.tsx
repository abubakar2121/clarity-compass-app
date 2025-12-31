"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getQuestionsForCompanySize } from "@/data/questions";
import { CompanySize, Question, DiagnosticSession, AuthUser, Report } from "@/lib/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { generateInsights } from "@/utils/ai-mock";
import { sendReportEmail } from "@/utils/email-mock";
import { trackEvent } from "@/utils/tracking-mock";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import API_URL from "@/config";

const DiagnosticPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth(); // Get user from AuthContext
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showAffirmation, setShowAffirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  // Load user data and questions on component mount
  useEffect(() => {
    if (!isAuthenticated || !user) {
      toast.error("You need to be logged in to start a diagnostic.");
      navigate("/login");
      return;
    }

    const startDiagnosticSession = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/session/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: user.name,
            email: user.email,
            companySize: user.companySize,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to start session');
        }

        const data = await response.json();
        setSessionId(data.sessionId);
        setQuestions(data.questions);
        localStorage.setItem("founderClaritySessionId", data.sessionId);
        trackEvent("diagnostic_started", user.id, data.sessionId, {
          companySize: user.companySize,
        });
      } catch (error) {
        setError("Failed to start a new diagnostic session. Please try again.");
        toast.error("Failed to start a new session.");
      }
    };

    const initializeSession = async () => {
      // Always start a new session to ensure we have a valid session ID
      // Clear any old session ID from localStorage first
      localStorage.removeItem("founderClaritySessionId");
      localStorage.removeItem("founderClaritySession");
      await startDiagnosticSession();
    };

    initializeSession();

    // Explicitly validate company_size_range from AuthUser
    const validCompanySizes: CompanySize[] = ["15-35", "36-60", "61-95", "96-200"];
    if (!user.companySize || !validCompanySizes.includes(user.companySize)) {
      console.error("Invalid or missing company size in user data:", user.companySize);
      setError("Invalid company size found in your profile. Please contact support or re-register.");
      toast.error("Invalid company size. Please contact support.");
      logout(); // Log out user with bad data
      return;
    }

    // Load previous answers if any (e.g., on refresh)
    const storedSession = localStorage.getItem("founderClaritySession");
    if (storedSession) {
      const parsedSession: DiagnosticSession = JSON.parse(storedSession);
      const currentSessionId = localStorage.getItem("founderClaritySessionId");
      if (parsedSession.session_id === currentSessionId && parsedSession.user_id === user.id) {
        setAnswers(parsedSession.answers);
        // Find the last answered question to resume
        const lastAnsweredIndex = questions.findIndex(q => !parsedSession.answers[q.question_id]);
        if (lastAnsweredIndex !== -1 && lastAnsweredIndex < questions.length) {
          setCurrentQuestionIndex(lastAnsweredIndex);
        } else if (parsedSession.status === "completed") {
          // If session was completed, redirect to report
          navigate("/report");
          return;
        }
      }
    }
    // Handle page unload/refresh for drop-off tracking
    const handleBeforeUnload = () => {
      const currentSessionId = localStorage.getItem("founderClaritySessionId");
      if (user && currentSessionId && currentQuestionIndex < questions.length) {
        trackEvent("drop_off", user.id, currentSessionId, {
          lastQuestionId: questions[currentQuestionIndex]?.question_id,
          progress: `${currentQuestionIndex}/${questions.length}`,
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isAuthenticated, user, navigate, logout]);

  // Update selectedAnswer when currentQuestionIndex changes (to show previous answer)
  useEffect(() => {
    if (currentQuestion) {
      setSelectedAnswer(answers[currentQuestion.question_id] || null);
    }
  }, [currentQuestionIndex, currentQuestion, answers]);


  const handleAnswerChange = (value: string) => {
    setSelectedAnswer(value);
  };

  const handleNextQuestion = useCallback(async () => {
    if (!selectedAnswer) {
      toast.error("Please select an answer to continue.");
      return;
    }

    if (!user || !sessionId) {
      setError("User data or session ID missing. Please restart.");
      toast.error("User data or session ID missing. Please restart.");
      logout();
      return;
    }

    const updatedAnswers = { ...answers, [currentQuestion.question_id]: selectedAnswer };
    setAnswers(updatedAnswers);
    setSelectedAnswer(null); // Clear selection for next question

    // Store current session state
    const currentSessionState: DiagnosticSession = {
      session_id: sessionId,
      user_id: user.id,
      start_time: new Date(), // This should ideally be the actual start time, but for mock, current date is fine
      answers: updatedAnswers,
      status: "started",
    };
    localStorage.setItem("founderClaritySession", JSON.stringify(currentSessionState));


    // Show affirmation
    setShowAffirmation(true);
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Show affirmation for 1.5 seconds
    setShowAffirmation(false);

    // If it's the last question, generate report
    if (currentQuestionIndex === questions.length - 1) {
      setIsLoading(true);
      setError(null);
      try {
        const diagnosticSession: DiagnosticSession = {
          session_id: sessionId,
          user_id: user.id,
          start_time: new Date(), // Assuming created_date is session start
          end_time: new Date(),
          answers: updatedAnswers,
          status: "completed",
        };

        const report: Report = await generateInsights(diagnosticSession, user.name);
        const emailSent = await sendReportEmail(user.email, report, user.name);

        const finalReport: Report = { ...report };

        localStorage.setItem("founderClarityReport", JSON.stringify(finalReport));
        localStorage.setItem("founderClaritySession", JSON.stringify({ ...diagnosticSession, status: "completed" })); // Update session status

        trackEvent("completion", user.id, sessionId, {
          reportId: finalReport.id,
          companySize: user.companySize,
        });

        toast.success("Diagnostic complete! Your report is ready.");
        navigate(`/report/${finalReport.id}`);
      } catch (err) {
        console.error("Failed to generate report:", err);
        setError("Failed to generate report. Please try again.");
        toast.error("Failed to generate report.");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Move to next question
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
    }
  }, [selectedAnswer, answers, currentQuestion, currentQuestionIndex, questions.length, user, sessionId, navigate, logout]);

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prevIndex) => prevIndex - 1);
      // The useEffect above will handle setting selectedAnswer for the previous question
    }
  };

  if (!user || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <p className="text-lg">Loading diagnostic...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <Card key="loading-card" className="w-full max-w-2xl bg-card border-border text-card-foreground shadow-lg text-center p-8">
          <CardTitle className="text-3xl font-bold text-primary">
            Generating Your Insights...
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-4">
            Please wait a moment while our AI processes your responses.
          </CardDescription>
          <div className="mt-8">
            <svg className="animate-spin h-10 w-10 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-muted-foreground mt-4">This usually takes less than 30 seconds.</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <Card key="error-card" className="w-full max-w-md bg-card border-border text-card-foreground shadow-lg text-center p-8">
          <CardTitle className="text-3xl font-bold text-destructive">Error</CardTitle>
          <CardDescription className="text-muted-foreground mt-4">{error}</CardDescription>
          <Button onClick={() => navigate("/signup")} className="mt-6 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
            Restart Diagnostic
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <Card key={currentQuestionIndex} className="w-full max-w-2xl bg-card border-border text-card-foreground shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">
            Diagnostic Questionnaire
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            Question {currentQuestionIndex + 1} of {questions.length}
          </CardDescription>
          <Progress value={progress} className="w-full mt-4 h-2 bg-secondary [&::-webkit-progress-bar]:bg-secondary [&::-webkit-progress-value]:bg-primary" />
        </CardHeader>
        <CardContent className="space-y-6">
          {showAffirmation && currentQuestion.affirmation_text ? (
            <div className="text-center text-lg text-accent-foreground animate-fade-in">
              {currentQuestion.affirmation_text}
            </div>
          ) : (
            <>
              <p className="text-foreground text-xl font-semibold leading-relaxed">
                {currentQuestion?.text}
              </p>
              {currentQuestion?.type === "multiple_choice" && currentQuestion.options && (
                <RadioGroup
                  onValueChange={handleAnswerChange}
                  value={selectedAnswer || ""}
                  className="space-y-4"
                >
                  {currentQuestion.options.map((option) => (
                    <div key={option.value} className="flex items-center space-x-3">
                      <RadioGroupItem
                        value={option.value}
                        id={option.value}
                        className="text-primary border-input focus:ring-ring"
                      />
                      <Label htmlFor={option.value} className="text-foreground text-base cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              {/* Add other question types (scale, text_input) here if needed in the future */}
              <div className="flex justify-between gap-4 mt-6">
                <Button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0 || isLoading}
                  variant="outline"
                  className="flex-1 bg-secondary border-border text-secondary-foreground hover:bg-secondary/80 text-lg py-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                  Previous Question
                </Button>
                <Button
                  onClick={handleNextQuestion}
                  disabled={!selectedAnswer || isLoading}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                  {currentQuestionIndex === questions.length - 1 ? "Get My Report" : "Next Question"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DiagnosticPage;