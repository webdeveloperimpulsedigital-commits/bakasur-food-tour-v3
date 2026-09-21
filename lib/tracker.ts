'use client';

export interface TrackStepOptions {
  sessionId?: string;
  stepName: string;
  stepTitle?: string;
  stepNumber?: number;
  userLocation?: string;
  latitude?: number;
  longitude?: number;
  restaurantId?: number;
  dishId?: number;
  foodMeterPercentage?: number;
  metadata?: Record<string, unknown>;
}

const SESSION_KEY = 'bakasur_session_id';

/**
 * Generate a unique session ID for the user
 * Example format: bkt_sess_1726048123456_k8m29fa
 */
export function generateSessionId(): string {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 9);
  const extraPart = Math.random().toString(36).substring(2, 6);
  return `bkt_sess_${timestamp}_${randomPart}${extraPart}`;
}

/**
 * Retrieve current session ID from localStorage or generate a fresh one
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return generateSessionId();
  }

  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Reset session ID (e.g. when user restarts the tour)
 */
export function resetSessionId(): string {
  const newSessionId = generateSessionId();
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, newSessionId);
  }
  return newSessionId;
}

/**
 * Track an individual step of the user journey in the database
 */
export async function trackUserStep(options: TrackStepOptions): Promise<void> {
  if (typeof window === 'undefined') return;

  const sessionId = options.sessionId || getOrCreateSessionId();

  const payload = {
    session_id: sessionId,
    step_name: options.stepName,
    step_title: options.stepTitle || formatStepTitle(options.stepName),
    step_number: options.stepNumber,
    user_location: options.userLocation,
    latitude: options.latitude,
    longitude: options.longitude,
    restaurant_id: options.restaurantId,
    dish_id: options.dishId,
    food_meter_percentage: options.foodMeterPercentage,
    metadata: {
      ...options.metadata,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      screen: `${window.innerWidth}x${window.innerHeight}`
    }
  };

  try {
    // Use keepalive fetch to ensure requests complete even during quick navigation
    await fetch('/api/campaign/journey/step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    });
  } catch (err) {
    // Non-blocking catch to ensure smooth user experience
    console.warn('Track step notice:', err);
  }
}

function formatStepTitle(step: string): string {
  const map: Record<string, string> = {
    start: 'Landing Page Viewed',
    city: 'City & Location Selected',
    restaurant: 'Restaurant Selected',
    dish: 'Dish & Spice Selected',
    eating: 'Feasting Stage 1 (20%)',
    feasting_stage_1: 'Feasting Stage 1 (20%)',
    feasting_stage_2: 'Feasting Stage 2 (45%)',
    feasting_stage_3: 'Feasting Stage 3 (85%)',
    heartburn: 'Heartburn Overload (100%)',
    relief_countdown: '6-Second Gastrium Relief Active',
    relief_done: 'Relief Complete',
    pass: 'Official Tour Pass & Contest',
    map: 'Collective Food Tour Map Explored',
    tour_restarted: 'Food Tour Restarted'
  };
  return map[step] || step.replace(/_/g, ' ').toUpperCase();
}
