import iconDoctorVisits from '../icons/icon-doctor-visit.svg';
import iconBeneficiary from '../icons/icon-beneficiary-registered.svg';
import iconTimeSpent from '../icons/icon-daily-time-spent.svg';
import iconSevikaVisits from '../icons/icon-sevika-visits.svg';
import iconHousehold from '../icons/icon-household-registered.svg';
import iconStatus from '../icons/icon-status.svg';

export interface AchievementItem {
  id: string;
  label: string;
  value: string | number;
  icon: string;
  valueColor?: string;
}

export const achievementsData: AchievementItem[] = [
  {
    id: 'doctor-visits',
    label: 'Doctor Visits',
    value: 0,
    icon: iconDoctorVisits,
    valueColor: 'text-red-500',
  },
  {
    id: 'beneficiary-registered',
    label: 'Beneficiary Registered',
    value: 0,
    icon: iconBeneficiary,
    valueColor: 'text-red-500',
  },
  {
    id: 'daily-time-spent',
    label: 'Daily time spent',
    value: '0m',
    icon: iconTimeSpent,
    valueColor: 'text-green-500',
  },
  {
    id: 'sevika-ncd-visits',
    label: 'Sevika/ NCD Visits',
    value: 0,
    icon: iconSevikaVisits,
  },
  {
    id: 'household-registered',
    label: 'Household Registered',
    value: 0,
    icon: iconHousehold,
  },
  {
    id: 'status',
    label: 'Status',
    value: 'Active',
    icon: iconStatus,
    valueColor: 'text-green-500',
  },
];
