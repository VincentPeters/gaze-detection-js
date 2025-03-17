/**
 * CardHeader - Header section of the Card component
 */

import React from 'react';

/**
 * CardHeader component
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Header content
 * @param {string} [props.className] - Additional CSS class names
 * @returns {JSX.Element} The rendered card header
 */
function CardHeader({
  children,
  className = '',
  ...restProps
}) {
  // Combine class names
  const headerClasses = [
    'card-header',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={headerClasses} data-testid="card-header" {...restProps}>
      {children}
    </div>
  );
}

export default CardHeader;
