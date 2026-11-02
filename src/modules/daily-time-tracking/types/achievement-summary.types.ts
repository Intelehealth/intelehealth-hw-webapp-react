/**
 * Types for the portal's Achievements summary and activity heartbeat APIs.
 * `from` and `to` are null for the all-time range.
 *
 * `doctorVisitsInRange`, `beneficiariesRegisteredInRange` and
 * `timeSpentSecondsInRange` are for the dates asked for (today by default). `doctorVisitsCompletedTotal` and
 * `beneficiariesRegisteredTotal` (this health worker's own number) are
 * everything up to now; the dashboard panel shows those two.
 *
 * `visitsPendingFromDoctor` is in the response for other uses. The panel does
 * not show it.
 *
 * `averageDailyTimeSpentSeconds` is this health worker's average per day over
 * every day with activity up to now, and `activeDaysCount` the number of those
 * days. Neither depends on the dates asked for. API only, not shown in the
 * panel.
 */
export interface AchievementSummary {
  from: string | null;
  to: string | null;
  doctorVisitsInRange: number | null;
  doctorVisitsCompletedTotal: number | null;
  visitsPendingFromDoctor: number | null;
  beneficiariesRegisteredInRange: number | null;
  beneficiariesRegisteredTotal: number | null;
  timeSpentSecondsInRange: number | null;
  averageDailyTimeSpentSeconds?: number;
  activeDaysCount?: number;
  status: 'Active' | 'Inactive' | null;
}

export interface AchievementSummaryParams {
  from?: string;
  to?: string;
  period?: 'today' | 'overall';
}

export interface AchievementSummaryResponse {
  success: boolean;
  message: string;
  data: AchievementSummary;
}

export interface HeartbeatResult {
  activityDate: string;
  todaySeconds: number;
}

export interface HeartbeatResponse {
  success: boolean;
  message: string;
  data: HeartbeatResult;
}
