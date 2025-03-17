/**
 * CardBody - Body section of the Card component
 */

import React from 'react';

/**
 * CardBody component
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Body content
 * @param {string} [props.className] - Additional CSS class names
 * @returns {JSX.Element} The rendered card body
 */
function CardBody({
  children,
  className = '',
  ...restProps
}) {
  // Combine class names
  const bodyClasses = [
    'card-body',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={bodyClasses} data-testid="card-body" {...restProps}>
      {children}
    </div>
  );
}

export default CardBody;
