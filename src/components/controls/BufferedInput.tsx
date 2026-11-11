import React, { useState, useEffect, InputHTMLAttributes } from 'react';

export interface BufferedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string | number;
  onChange: (val: string | number) => void;
  type?: string;
  className?: string;
}

export const BufferedInput: React.FC<BufferedInputProps> = ({ 
  value, 
  onChange, 
  type = "text", 
  className = '', 
  ...props 
}) => {
  const [localValue, setLocalValue] = useState<string | number>(value);
  const [active, setActive] = useState(false);

  // Sync with prop value only when not active (not typing)
  useEffect(() => {
    if (!active) setLocalValue(value);
  }, [value, active]);

  const handleCommit = () => {
    onChange(localValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // Triggers onBlur which commits
    }
  };

  const numberSpinStyles = type === 'number' 
    ? '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none' 
    : '';

  return (
    <input
      {...props}
      type={type}
      className={`${numberSpinStyles} ${className}`.trim()}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onFocus={() => setActive(true)}
      onBlur={() => { setActive(false); handleCommit(); }}
      onKeyDown={handleKeyDown}
    />
  );
};

export default BufferedInput;
