import iconDoctorVisits from '../icons/icon-doctor-visit.svg';
import iconBeneficiary from '../icons/icon-beneficiary-registered.svg';
import iconTimeSpent from '../icons/icon-daily-time-spent.svg';
import iconStatus from '../icons/icon-status.svg';

/** The field of the portal summary response that a card shows. */
export type AchievementKey =
  | 'doctorVisitsCompletedTotal'
  | 'beneficiariesRegisteredTotal'
  | 'dailyTimeSpentSeconds'
  | 'status';

export interface AchievementItem {
  id: string;
  label: string;
  key: AchievementKey;
  icon: string;
  valueColor?: string;
}

/**
 * The cards of the dashboard Achievements panel. Labels, icons and colours
 * live here. The values come from the portal summary API.
 */
export const achievementsData: AchievementItem[] = [
  {
    id: 'doctor-visits',
    label: 'Doctor Visits',
    key: 'doctorVisitsCompletedTotal',
    icon: iconDoctorVisits,
    valueColor: 'text-red-500',
  },
  {
    id: 'beneficiary-registered',
    label: 'Beneficiary Registered',
    key: 'beneficiariesRegisteredTotal',
    icon: iconBeneficiary,
    valueColor: 'text-red-500',
  },
  {
    id: 'daily-time-spent',
    label: 'Time on Duty',
    key: 'dailyTimeSpentSeconds',
    icon: iconTimeSpent,
    valueColor: 'text-green-500',
  },
  {
    id: 'status',
    label: 'Status',
    key: 'status',
    icon: iconStatus,
    valueColor: 'text-green-500',
  },
];
