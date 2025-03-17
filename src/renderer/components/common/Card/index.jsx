/**
 * Card - A container component with header, body, and footer sections
 */

import React from 'react';
import './Card.css';
import CardHeader from './subcomponents/CardHeader';
import CardBody from './subcomponents/CardBody';
import CardFooter from './subcomponents/CardFooter';

/**
 * Card component
 *
 * @param {Object} props
 * @param {string} [props.variant='default'] - Card variant (default, outlined, elevated)
 * @param {boolean} [props.isFullWidth=false] - Whether the card should take full width
 * @param {React.ReactNode} props.children - Card content
 * @param {string} [props.className] - Additional CSS class names
 * @returns {JSX.Element} The rendered card
 */
function Card({
  variant = 'default',
  isFullWidth = false,
  children,
  className = '',
  ...restProps
}) {
  // Combine class names
  const cardClasses = [
    'card',
    `card--${variant}`,
    isFullWidth ? 'card--full-width' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} data-testid="card" {...restProps}>
      {children}
    </div>
  );
}

// Attach subcomponents
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
