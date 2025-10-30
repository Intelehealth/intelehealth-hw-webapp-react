/**
 * Calculate age from date of birth
 * @param dateOfBirth - Date of birth string (YYYY-MM-DD format)
 * @returns Calculated age in years, or null if invalid date
 */
export const calculateAge = (dateOfBirth: string): number | null => {
  if (!dateOfBirth || dateOfBirth.trim() === '') {
    return null;
  }

  try {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);

    // Check if the date is valid
    if (isNaN(birthDate.getTime())) {
      return null;
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Adjust age if birthday hasn't occurred this year
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    // For future dates, return 0 (newborn) instead of null
    // This allows the age field to show 0 for future birth dates
    return age < 0 ? 0 : age;
  } catch (error) {
    console.error('Error calculating age:', error);
    return null;
  }
};

/**
 * Format date to YYYY-MM-DD format
 * @param date - Date object or string
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Check if a date is valid
 * @param dateString - Date string to validate
 * @returns True if date is valid, false otherwise
 */
export const isValidDate = (dateString: string): boolean => {
  if (!dateString || dateString.trim() === '') {
    return false;
  }

  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString === formatDate(date);
  } catch (error) {
    return false;
  }
};
