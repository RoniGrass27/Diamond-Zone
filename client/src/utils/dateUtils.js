import { format, parseISO, isValid } from "date-fns";

/**
 * Safely format a date value, handling various input formats and cleaning unwanted characters
 * @param {string|Date} dateValue - The date value to format
 * @param {string} formatString - The format string (default: 'MMM d, yyyy')
 * @returns {string} - Formatted date string or fallback
 */
export function formatDate(dateValue, formatString = 'MMM d, yyyy') {
  if (!dateValue) return '—';
  
  let date;
  
  if (typeof dateValue === 'string') {
    // Clean the string to remove any unwanted characters that might be concatenated
    let cleanDateString = dateValue;
    
    // If it looks like there's extra data after the date, try to extract just the date part
    if (dateValue.includes('PM') || dateValue.includes('AM')) {
      const parts = dateValue.split(/\s+/);
      if (parts.length >= 3) {
        cleanDateString = parts.slice(0, 3).join(' ');
      }
    }
    
    // Remove any non-date characters (keep only numbers, letters, spaces, commas, hyphens, colons, T)
    cleanDateString = cleanDateString.replace(/[^0-9a-zA-Z\s,:-T]/g, '');
    
    try {
      // Try parsing as ISO string first
      if (cleanDateString.includes('T') || cleanDateString.includes('-')) {
        date = parseISO(cleanDateString);
      } else {
        // Try parsing as a regular date string
        date = new Date(cleanDateString);
      }
    } catch (error) {
      console.warn('Date parsing error:', error);
      return 'Invalid Date';
    }
  } else if (dateValue instanceof Date) {
    date = dateValue;
  } else {
    return '—';
  }
  
  if (!isValid(date)) {
    return 'Invalid Date';
  }
  
  try {
    return format(date, formatString);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid Date';
  }
}

/**
 * Format a date with time for contracts and messages
 * @param {string|Date} dateValue - The date value to format
 * @returns {string} - Formatted date and time string
 */
export function formatDateTime(dateValue) {
  return formatDate(dateValue, "MMM d, yyyy 'at' HH:mm");
}

/**
 * Format a date for display in messages (includes time with 'at')
 * @param {string|Date} dateValue - The date value to format
 * @returns {string} - Formatted date and time string
 */
export function formatMessageDate(dateValue) {
  return formatDate(dateValue, "MMM d, yyyy 'at' HH:mm");
}

/**
 * Format a date for compact display (shorter format with 'at')
 * @param {string|Date} dateValue - The date value to format
 * @returns {string} - Formatted compact date and time string
 */
export function formatCompactDate(dateValue) {
  return formatDate(dateValue, "MMM d 'at' HH:mm");
}

/**
 * Format a date for display in detailed views (includes 'at' with time)
 * @param {string|Date} dateValue - The date value to format
 * @returns {string} - Formatted date and time string with 'at'
 */
export function formatDetailedDate(dateValue) {
  return formatDate(dateValue, "MMM d, yyyy 'at' HH:mm");
}

/**
 * Format a date for contracts and business documents (DATE ONLY)
 * @param {string|Date} dateValue - The date value to format
 * @returns {string} - Formatted date string
 */
export function formatContractDate(dateValue) {
  return formatDate(dateValue, 'MMM d, yyyy');
}

/**
 * Format a date for contracts with creation time
 * @param {string|Date} dateValue - The date value to format
 * @returns {string} - Formatted date and time string
 */
export function formatContractDateTime(dateValue) {
  return formatDate(dateValue, "MMM d, yyyy 'at' HH:mm");
}

/**
 * Check if a date is expiring soon (within 5 days)
 * @param {string|Date} dateValue - The date value to check
 * @returns {boolean} - True if expiring soon
 */
export function isExpiringSoon(dateValue) {
  if (!dateValue) return false;
  
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (!isValid(date)) return false;
    
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + 5);
    
    return date < warningDate;
  } catch (error) {
    return false;
  }
}