import { format, parseISO, isValid } from "date-fns";

/**
 * Safely parse a date value, handling various input formats
 * @param {string|Date|number} dateValue - The date value to parse
 * @returns {Date|null} - Parsed date or null if invalid
 */
function parseDate(dateValue) {
  if (!dateValue) return null;
  
  try {
    let date;
    
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'number') {
      date = new Date(dateValue);
    } else if (typeof dateValue === 'string') {
      // Clean the string to remove any unwanted characters
      let cleanDateString = dateValue.trim();
      
      // Remove any non-date characters but keep important date/time chars
      cleanDateString = cleanDateString.replace(/[^0-9a-zA-Z\s,:-T.Z+]/g, '');
      
      // Try different parsing methods
      if (cleanDateString.includes('T') || cleanDateString.match(/\d{4}-\d{2}-\d{2}/)) {
        // Looks like ISO format
        date = parseISO(cleanDateString);
      } else {
        // Try regular Date constructor
        date = new Date(cleanDateString);
      }
    } else {
      return null;
    }
    
    // Validate the parsed date
    if (!isValid(date) || isNaN(date.getTime())) {
      console.warn('Invalid date parsed:', dateValue);
      return null;
    }
    
    return date;
  } catch (error) {
    console.error('Date parsing error:', error, 'for value:', dateValue);
    return null;
  }
}

/**
 * Safely format a date value, handling various input formats
 * @param {string|Date|number} dateValue - The date value to format
 * @param {string} formatString - The format string (default: 'MMM d, yyyy')
 * @returns {string} - Formatted date string or fallback
 */
export function formatDate(dateValue, formatString = 'MMM d, yyyy') {
  const date = parseDate(dateValue);
  
  if (!date) {
    return '—';
  }
  
  try {
    return format(date, formatString);
  } catch (error) {
    console.error('Date formatting error:', error, 'for value:', dateValue);
    return 'Invalid Date';
  }
}

/**
 * Format a date with time for contracts and messages
 * @param {string|Date|number} dateValue - The date value to format
 * @returns {string} - Formatted date and time string
 */
export function formatDateTime(dateValue) {
  return formatDate(dateValue, "MMM d, yyyy 'at' HH:mm");
}

/**
 * Format a date for display in messages (includes time with 'at')
 * @param {string|Date|number} dateValue - The date value to format
 * @returns {string} - Formatted date and time string
 */
export function formatMessageDate(dateValue) {
  return formatDate(dateValue, "MMM d, yyyy 'at' HH:mm");
}

/**
 * Format a date for compact display (shorter format with 'at')
 * @param {string|Date|number} dateValue - The date value to format
 * @returns {string} - Formatted compact date and time string
 */
export function formatCompactDate(dateValue) {
  return formatDate(dateValue, "MMM d 'at' HH:mm");
}

/**
 * Format a date for display in detailed views (includes 'at' with time)
 * @param {string|Date|number} dateValue - The date value to format
 * @returns {string} - Formatted date and time string with 'at'
 */
export function formatDetailedDate(dateValue) {
  return formatDate(dateValue, "MMM d, yyyy 'at' HH:mm");
}

/**
 * Format a date for contracts and business documents (DATE ONLY)
 * @param {string|Date|number} dateValue - The date value to format
 * @returns {string} - Formatted date string
 */
export function formatContractDate(dateValue) {
  return formatDate(dateValue, 'MMM d, yyyy');
}

/**
 * Format a date for contracts with creation time
 * @param {string|Date|number} dateValue - The date value to format
 * @returns {string} - Formatted date and time string
 */
export function formatContractDateTime(dateValue) {
  return formatDate(dateValue, "MMM d, yyyy 'at' HH:mm");
}

/**
 * Check if a date is expiring soon (within 5 days)
 * @param {string|Date|number} dateValue - The date value to check
 * @returns {boolean} - True if expiring soon
 */
export function isExpiringSoon(dateValue) {
  const date = parseDate(dateValue);
  
  if (!date) return false;
  
  try {
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + 5);
    
    return date < warningDate;
  } catch (error) {
    console.error('Date comparison error:', error);
    return false;
  }
}