import { TrackingEvent, TrackingEventType } from "@/lib/types";

// This is a mock tracking service. In a real application, this would send data to an analytics platform.
export const trackEvent = (
  eventType: TrackingEventType,
  userId?: string,
  sessionId?: string,
  details?: Record<string, any>,
) => {
  const event: TrackingEvent = {
    event_id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    event_type: eventType,
    event_timestamp: new Date(),
    user_id: userId,
    session_id: sessionId,
    details: details,
  };

  console.log("Mock Tracking Service: Event recorded", event);

  // In a real app, you might send this to an analytics API or store in localStorage for later batching.
  // For now, we'll just log it.
};