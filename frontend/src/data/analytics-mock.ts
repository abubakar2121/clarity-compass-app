import { CompanySize } from "@/lib/types";

export interface AnalyticsDataPoint {
  companySize: CompanySize | "Overall";
  Delegation: number;
  Onboarding: number;
  Alignment: number;
  "Strategic Planning": number;
  "Talent Acquisition": number;
}

export const mockAnalyticsData: AnalyticsDataPoint[] = [
  { companySize: "15-35", Delegation: 70, Onboarding: 50, Alignment: 30, "Strategic Planning": 45, "Talent Acquisition": 35 },
  { companySize: "36-60", Delegation: 40, Onboarding: 60, Alignment: 75, "Strategic Planning": 60, "Talent Acquisition": 55 },
  { companySize: "61-95", Delegation: 20, Onboarding: 40, Alignment: 80, "Strategic Planning": 70, "Talent Acquisition": 65 },
  { companySize: "96-200", Delegation: 10, Onboarding: 30, Alignment: 90, "Strategic Planning": 85, "Talent Acquisition": 75 },
  { companySize: "Overall", Delegation: 35, Onboarding: 45, Alignment: 68, "Strategic Planning": 65, "Talent Acquisition": 58 },
];