// components/shared/Checkbox.tsx
import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string | React.ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  id,
  containerClassName = '',
  labelClassName = '',
  inputClassName = '',
  ...props
}) => {
  return (
    <div className={`flex items-center ${containerClassName}`}>
      <input
        type="checkbox"
        id={id}
        className={`form-checkbox h-5 w-5 rounded border-[#d1c0c1] text-[#ea2832] focus:ring-[#ea2832]/50 disabled:opacity-60 disabled:cursor-not-allowed ${inputClassName}`}
        {...props}
      />
      <label htmlFor={id} className={`ml-3 block text-base font-medium text-[#1b0e0e] ${labelClassName}`}>
        {label}
      </label>
    </div>
  );
};
