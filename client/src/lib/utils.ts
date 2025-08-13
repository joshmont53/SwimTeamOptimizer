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
