import { DiagnosticSession, Report, InsightType } from "@/lib/types";
import { mockQuestions } from "@/data/questions";
import API_URL from "@/config";

interface PotentialInsight {
  mindsetShift?: string;
  mindsetShiftInsight?: string; // New field
  operationalFocus?: string;
  operationalFocusInsight?: string; // New field
  nextMove?: { type: InsightType; description: string; details?: string };
  ctaLink?: string;
  triggerAnswers: Record<string, string[]>; // question_id: [answer_value1, answer_value2]
}

const potentialInsights: PotentialInsight[] = [
  {
    mindsetShift: "From Doer to Delegator",
    mindsetShiftInsight: "You're still deeply involved in day-to-day tasks, making it hard to scale. Shifting your focus to empowering your team will unlock significant growth.",
    operationalFocus: "Empowering Your Leadership Team",
    operationalFocusInsight: "Your current leadership structure might be hindering growth. Focusing on empowering your team will free up critical resources and accelerate decision-making.",
    nextMove: {
      type: "action",
      description: "Create a 90-day delegation plan.",
      details: "Identify 3-5 tasks you can delegate immediately. Document the process for each, assign to a team member, and schedule weekly check-ins.",
    },
    triggerAnswers: {
      q1: ["always", "often"], // Personally involved in day-to-day tasks
      q3: ["not_confident", "somewhat_confident"], // Confidence in team execution without oversight
      q8: ["constantly", "frequently"], // Overwhelmed by decisions
    },
  },
  {
    mindsetShift: "From Operator to Strategist",
    mindsetShiftInsight: "You might be spending too much time in the weeds. Elevating your perspective to strategic planning is crucial for long-term vision and growth.",
    operationalFocus: "Enhancing Leadership Alignment",
    operationalFocusInsight: "Misalignment within your leadership team can slow execution. A clear, shared understanding of strategic priorities is essential for cohesive progress.",
    nextMove: {
      type: "consult",
      description: "Schedule a leadership alignment workshop.",
      details: "Consider bringing in an external facilitator to help your leadership team define shared goals and responsibilities.",
    },
    ctaLink: "https://calendly.com/your-workshop-link",
    triggerAnswers: {
      q2: ["today", "this_week", "this_month"], // Feeling off from team energy/direction
      q5: ["rarely", "sometimes"], // Leadership team alignment on strategic priorities
      q7: ["unclear", "somewhat_clear"], // Clarity of roles and responsibilities
      q11: ["never", "rarely"], // Dedicated time for strategic thinking
    },
  },
  {
    mindsetShift: "From Reactive to Proactive Systems Builder",
    mindsetShiftInsight: "You're likely reacting to issues as they arise. Building robust systems and processes will prevent future bottlenecks and enable smoother scaling.",
    operationalFocus: "Optimizing Talent Acquisition & Onboarding",
    operationalFocusInsight: "Inefficient hiring and onboarding processes can drain resources and impact team morale. Streamlining these will attract and retain top talent more effectively.",
    nextMove: {
      type: "action",
      description: "Develop a standardized onboarding checklist.",
      details: "Outline key steps for new hires in their first 30, 60, and 90 days, including clear role expectations and initial projects.",
    },
    triggerAnswers: {
      q4: ["chaotic", "basic"], // Onboarding process description
      q12: ["ineffective", "adequate"], // Effectiveness of hiring process
    },
  },
  {
    mindsetShift: "From Firefighter to Architect of Culture",
    mindsetShiftInsight: "You might be constantly putting out fires. Shifting to intentionally designing and nurturing your company culture will foster a more resilient and engaged team.",
    operationalFocus: "Fostering Psychological Safety & Collaboration",
    operationalFocusInsight: "A lack of psychological safety can stifle innovation and open communication. Cultivating an environment where team members feel safe to speak up is paramount.",
    nextMove: {
      type: "reflection",
      description: "Initiate a 'safe space' discussion with your team.",
      details: "Hold a team meeting focused on open communication, feedback, and psychological safety. Lead by example.",
    },
    triggerAnswers: {
      q6: ["poorly", "adequately"], // Cross-functional collaboration
      q10: ["low", "moderate"], // Psychological safety within the team
    },
  },
  {
    mindsetShift: "From Intuitive to Data-Driven Leader",
    mindsetShiftInsight: "While intuition is valuable, relying solely on it can be risky. Embracing data-driven decision-making will provide clearer direction and measurable outcomes.",
    operationalFocus: "Improving Performance Measurement & Accountability",
    operationalFocusInsight: "Without clear KPIs and accountability, it's hard to track progress and identify areas for improvement. Establishing robust measurement systems is key.",
    nextMove: {
      type: "action",
      description: "Review and refine your core KPIs.",
      details: "Identify 3-5 critical KPIs for your business. Ensure clear ownership, regular tracking, and actionable insights derived from them.",
    },
    triggerAnswers: {
      q9: ["ineffective", "basic"], // Effectiveness of KPI tracking systems
    },
  },
  // Default/fallback insight
  {
    mindsetShift: "From Busy to Focused Growth Driver",
    mindsetShiftInsight: "You might be feeling overwhelmed by constant activity. Prioritizing high-leverage activities will ensure your efforts are directed towards impactful growth.",
    operationalFocus: "Prioritizing High-Leverage Activities",
    operationalFocusInsight: "It's easy to get caught in the day-to-day. Identifying and focusing on activities that yield the greatest return will drive sustainable growth.",
    nextMove: {
      type: "reflection",
      description: "Conduct a 'time audit' for one week.",
      details: "Track how you spend your time for a week to identify time sinks and opportunities to delegate or eliminate tasks.",
    },
    triggerAnswers: {}, // This is a fallback, so no specific triggers
  },
];

// This is a mock AI service. In a real application, this would involve an API call to an LLM.
export const generateInsights = async (
  session: DiagnosticSession,
  userName: string,
): Promise<Report> => {
  console.log("Calling backend to complete session and generate report for session", session.session_id);

  try {
    const response = await fetch(`${API_URL}/api/v1/session/${session.session_id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(session.answers),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to generate report");
    }

    const result = await response.json();
    
    // The backend now returns the report directly.
    // The structure should match the Report type.
    // We need to ensure the backend response aligns with the frontend's `Report` type.
    // Let's assume the backend sends back the report object under a "report" key.
    const reportData = result.report;

    return {
      id: reportData._id, // Assuming the backend sends _id
      user_id: reportData.user_id,
      session_id: reportData.session_id,
      mindset_shift: reportData.mindset_shift,
      mindset_shift_insight: reportData.mindset_shift_insight,
      operational_focus: reportData.operational_focus,
      operational_focus_insight: reportData.operational_focus_insight,
      next_move: reportData.next_move,
      generated_at: reportData.generated_at,
    };
    
  } catch (error) {
    console.error("Error generating report:", error);
    throw error;
  }
};