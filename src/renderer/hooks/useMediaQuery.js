/**
 * Media Query Hook
 *
 * A custom hook for responsive design using media queries.
 */

import { useState, useEffect } from 'react';

/**
 * Custom hook for handling media queries
 *
 * @param {string} query - CSS media query string
 * @returns {boolean} Whether the media query matches
 */
function useMediaQuery(query) {
  // Initialize with the current match state
  const getMatches = (mediaQuery) => {
    // Check if window is defined (for SSR)
    if (typeof window !== 'undefined') {
      return window.matchMedia(mediaQuery).matches;
    }
    return false;
  };

  // State to track whether the media query matches
  const [matches, setMatches] = useState(getMatches(query));

  // Update matches state when the media query changes
  useEffect(() => {
    // Check if window is defined (for SSR)
    if (typeof window === 'undefined') {
      return undefined;
    }

    // Get the media query list
    const mediaQueryList = window.matchMedia(query);

    // Set the initial value
    setMatches(mediaQueryList.matches);

    // Define the change handler
    const handler = (event) => setMatches(event.matches);

    // Add the event listener
    if (mediaQueryList.addEventListener) {
      // Modern browsers
      mediaQueryList.addEventListener('change', handler);
    } else {
      // Older browsers
      mediaQueryList.addListener(handler);
    }

    // Clean up
    return () => {
      if (mediaQueryList.removeEventListener) {
        // Modern browsers
        mediaQueryList.removeEventListener('change', handler);
      } else {
        // Older browsers
        mediaQueryList.removeListener(handler);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Predefined breakpoints for common screen sizes
 */
export const breakpoints = {
  xs: '(max-width: 575.98px)',
  sm: '(min-width: 576px) and (max-width: 767.98px)',
  md: '(min-width: 768px) and (max-width: 991.98px)',
  lg: '(min-width: 992px) and (max-width: 1199.98px)',
  xl: '(min-width: 1200px)',
  mobile: '(max-width: 767.98px)',
  tablet: '(min-width: 768px) and (max-width: 991.98px)',
  desktop: '(min-width: 992px)',
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)'
};

export default useMediaQuery;
