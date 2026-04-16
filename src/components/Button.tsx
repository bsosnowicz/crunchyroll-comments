import React from 'react';

type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export function Button({
  size = 'md',
  disabled = false,
  onClick,
  children,
  type = 'button',
  className = '',
}: ButtonProps): React.ReactElement {
  return (
    <button
      type={type}
      className={`btn btn--${size}${className ? ` ${className}` : ''}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
