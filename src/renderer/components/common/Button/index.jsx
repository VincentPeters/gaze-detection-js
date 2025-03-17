/**
 * Button - A reusable button component with various styles and states
 */

import React from 'react';
import './Button.css';

/**
 * Button component
 *
 * @param {Object} props
 * @param {string} [props.variant='primary'] - Button variant (primary, secondary, danger, success)
 * @param {string} [props.size='medium'] - Button size (small, medium, large)
 * @param {boolean} [props.isFullWidth=false] - Whether the button should take full width
 * @param {boolean} [props.isDisabled=false] - Whether the button is disabled
 * @param {boolean} [props.isLoading=false] - Whether the button is in loading state
 * @param {Function} props.onClick - Click handler
 * @param {React.ReactNode} props.children - Button content
 * @param {string} [props.className] - Additional CSS class names
 * @returns {JSX.Element} The rendered button
 */
function Button({
  variant = 'primary',
  size = 'medium',
  isFullWidth = false,
  isDisabled = false,
  isLoading = false,
  onClick,
  children,
  className = '',
  ...restProps
}) {
  // Combine class names
  const buttonClasses = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    isFullWidth ? 'button--full-width' : '',
    isLoading ? 'button--loading' : '',
    className
  ].filter(Boolean).join(' ');

  // Handle click with loading state check
  const handleClick = (event) => {
    if (!isDisabled && !isLoading && onClick) {
      onClick(event);
    }
  };

  return (
    <button
      className={buttonClasses}
      disabled={isDisabled || isLoading}
      onClick={handleClick}
      data-testid="button"
      {...restProps}
    >
      {isLoading ? (
        <span className="button__loading-indicator" aria-hidden="true"></span>
      ) : null}
      <span className={isLoading ? 'button__content button__content--loading' : 'button__content'}>
        {children}
      </span>
    </button>
  );
}

export default Button;
