import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: Array<{ value: string | number; label: string }>;
}

const Select: React.FC<SelectProps> = ({ 
  error = false,
  options,
  className = '',
  ...props
}) => {
  return (
    <select
      className={`
        w-full px-4 py-3 text-base
        border rounded-lg
        focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
        transition-colors
        min-h-[44px]
        text-gray-800
        placeholder:text-gray-500
        ${error ? 'border-red-500' : 'border-gray-300'}
        ${props.disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'}
        ${className}
      `}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
