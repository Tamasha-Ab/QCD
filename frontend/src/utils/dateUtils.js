/**
 * Utility functions for date formatting and handling
 */

/**
 * Format a date string to a localized date string
 * @param {string} dateString - The date string to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
    if (!dateString) return 'N/A';

    try {
        const date = new Date(dateString);

        // Check if the date is valid
        if (isNaN(date.getTime())) {
            console.error('Invalid date:', dateString);
            return 'N/A';
        }

        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };

        // Merge with provided options
        const formatOptions = { ...defaultOptions, ...options };

        return date.toLocaleDateString('en-US', formatOptions);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'N/A';
    }
};

/**
 * Format a date for member since display (Month Year format)
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string
 */
export const formatMemberSince = (dateString) => {
    return formatDate(dateString, {
        month: 'long',
        year: 'numeric'
    });
};

/**
 * Format a date with time
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';

    try {
        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            console.error('Invalid date:', dateString);
            return 'N/A';
        }

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) + ' ' + date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date time:', error);
        return 'N/A';
    }
};

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {string} dateString - The date string
 * @returns {string} Relative time string
 */
export const getRelativeTime = (dateString) => {
    if (!dateString) return 'N/A';

    try {
        const date = new Date(dateString);
        const now = new Date();

        if (isNaN(date.getTime())) {
            console.error('Invalid date:', dateString);
            return 'N/A';
        }

        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;

        // For older dates, show the actual date
        return formatDate(dateString);
    } catch (error) {
        console.error('Error getting relative time:', error);
        return 'N/A';
    }
};
