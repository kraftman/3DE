import React from 'react';
export const Pip = ({
  status,
  label,
  targetTooltip,
  tooltipContent,
  onClick,
}) => {
  let className = 'pip';
  if (status === 'pass') {
    className += ' pip-green';
  } else if (status === 'warn') {
    className += ' pip-yellow';
  } else if (status === 'error') {
    className += ' pip-red';
  }

  return (
    <span
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : {}}
      data-tooltip-id={targetTooltip}
      data-tooltip-content={tooltipContent}
      className={className}
    ></span>
  );
};
