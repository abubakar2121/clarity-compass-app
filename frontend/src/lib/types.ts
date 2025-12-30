export type CompanySize = "15-35" | "36-60" | "61-95" | "96-200";
export type QuestionType = "multiple_choice" | "scale" | "text_input";
export type InsightType = "reflection" | "consult" | "action";
export type DiagnosticStatus = "started" | "completed" | "dropped_off";
export type TrackingEventType = "diagnostic_started" | "completion" | "drop_off" | "cta_click" | "onboarding_completed" | "login" | "signup" | "logout";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  companySize: CompanySize;
}

export interface User {
  user_id: string;
  email: string;
  name: string;
  company_size_range: CompanySize;
  created_date: Date;
}

export interface Question {
  question_id: string;
  text: string;
  stage_applicability: CompanySize[];
  type: QuestionType;
  options?: { value: string; label: string }[];
  affirmation_text?: string;
}

export interface DiagnosticSession {
  session_id: string;
  user_id: string;
  start_time: Date;
  end_time?: Date;
  answers: Record<string, string>; // question_id: answer_value
  status: DiagnosticStatus;
  drop_off_question_id?: string;
}

export interface Report {
  id: string;
  user_id: string;
  session_id: string;
  mindset_shift: string;
  mindset_shift_insight: string; // New field for detailed insight
  operational_focus: string;
  operational_focus_insight: string; // New field for detailed insight
  next_move: {
    type: InsightType;
    description: string;
    details?: string;
  };
  generated_at: string;
}

export interface TrackingEvent {
  event_id: string;
  user_id?: string;
  session_id?: string;
  event_type: TrackingEventType;
  event_timestamp: Date;
  details?: Record<string, any>;
}