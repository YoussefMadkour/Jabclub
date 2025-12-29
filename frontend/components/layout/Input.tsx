import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input: React.FC<InputProps> = ({ 
  error = false,
  className = '',
  ...props
}) => {
  return (
    <input
      className={`
        w-full px-4 py-3 text-base
        border rounded-lg
        focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
        transition-colors
        min-h-[44px]
        placeholder:text-gray-500
        text-gray-800
        ${error ? 'border-red-500' : 'border-gray-300'}
        ${props.disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'}
        ${className}
      `}
      {...props}
    />
  );
};

export default Input;
