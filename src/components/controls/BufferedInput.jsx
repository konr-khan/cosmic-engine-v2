import React, { useState, useEffect } from 'react';

export const BufferedInput = ({ value, onChange, type = "text", className, ...props }) => {
  const [localValue, setLocalValue] = useState(value);
  const [active, setActive] = useState(false);

  // Sync with prop value only when not active (not typing)
  useEffect(() => {
    if (!active) setLocalValue(value);
  }, [value, active]);

  const handleCommit = () => {
    onChange(localValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // Triggers onBlur which commits
    }
  };

  return (
    <input
      {...props}
      type={type}
      className={className}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onFocus={() => setActive(true)}
      onBlur={() => { setActive(false); handleCommit(); }}
      onKeyDown={handleKeyDown}
    />
  );
};
export default BufferedInput;
