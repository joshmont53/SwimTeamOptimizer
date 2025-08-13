import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts swimming time from seconds format (e.g., "75.34s") to mm:ss.mm format (e.g., "01:15.34")
 * Uses the same formatting logic as relay times for consistency
 * @param timeString - Time string in format "XX.XXs" (e.g., "75.34s")
 * @returns Formatted time string in mm:ss.mm format (e.g., "01:15.34")
 */
export function formatSwimmingTime(timeString: string): string {
  // Parse the time string to extract decimal seconds
  const seconds = parseFloat(timeString.replace('s', ''));
  
  // Handle invalid input
  if (isNaN(seconds) || seconds < 0) {
    return timeString; // Return original if parsing fails
  }
  
  // Use same logic as relay formatting in Python: f'{int(total_time // 60):02d}:{total_time % 60:05.2f}'
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  // Format: MM:SS.mm (e.g., 01:15.34)
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toFixed(2).padStart(5, '0')}`;
}

/**
 * Calculates competition age as of December 31st, 2025 (2025/26 swimming season)
 * Matches the backend calculation logic exactly
 * @param dateOfBirth - Date of birth in YYYY-MM-DD format
 * @returns Age as of December 31st, 2025
 */
export function calculateCompetitionAge(dateOfBirth: string): number {
  try {
    // Parse date in YYYY-MM-DD format
    const birthDate = new Date(dateOfBirth);
    // Calculate age as of December 31st, 2025 for 2025/26 swimming season
    const referenceDate = new Date(2025, 11, 31); // December 31st, 2025
    
    // Check if date is valid
    if (isNaN(birthDate.getTime())) {
      console.warn(`Invalid date of birth: ${dateOfBirth}`);
      return 0;
    }
    
    let age = referenceDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
    
    // Adjust if birthday hasn't occurred by December 31st, 2025
    if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return Math.max(0, age); // Ensure non-negative age
  } catch (error) {
    console.warn(`Error calculating age from date of birth: ${dateOfBirth}`, error);
    return 0;
  }
}
