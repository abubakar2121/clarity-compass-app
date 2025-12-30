import { Report } from "@/lib/types";
import { toast } from "sonner";

// This is a mock email service. In a real application, this would involve an API call to an email provider.
export const sendReportEmail = async (
  recipientEmail: string,
  report: Report,
  userName: string,
): Promise<boolean> => {
  console.log(`Mock Email Service: Sending report to ${recipientEmail}`);
  console.log("Report Content:", report);

  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const emailSubject = `Your Founder Clarity Compass Report is Ready, ${userName}!`;
  const emailBody = `
    Hello ${userName},

    Thank you for completing the Founder Clarity Compass! Here are your personalized insights:

    ### Your Top Mindset Shift: ${report.mindset_shift}
    *Insight:* ${report.mindset_shift_insight}

    ### Your Top Operational Focus: ${report.operational_focus}
    *Insight:* ${report.operational_focus_insight}

    ### Your Suggested Next Move: ${report.next_move.type} - ${report.next_move.description}
    *Details:* ${report.next_move.details}

    Ready to dive deeper?
    ${report.cta_link ? `[Book a Consult / Join the Founder Clarity List](${report.cta_link})` : ""}

    We hope this brings you clarity and peace of mind.

    Best,
    The Founder Clarity Compass Team
  `;

  console.log("--- MOCK EMAIL CONTENT ---");
  console.log("To:", recipientEmail);
  console.log("Subject:", emailSubject);
  console.log("Body:", emailBody);
  console.log("--------------------------");

  toast.success(`Report sent to ${recipientEmail}! (Mock Email Service)`);

  return true;
};