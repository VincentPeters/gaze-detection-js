/**
 * CardFooter - Footer section of the Card component
 */

import React from 'react';

/**
 * CardFooter component
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Footer content
 * @param {string} [props.className] - Additional CSS class names
 * @returns {JSX.Element} The rendered card footer
 */
function CardFooter({
  children,
  className = '',
  ...restProps
}) {
  // Combine class names
  const footerClasses = [
    'card-footer',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={footerClasses} data-testid="card-footer" {...restProps}>
      {children}
    </div>
  );
}

export default CardFooter;
