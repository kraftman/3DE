import React from 'react';
export const Pip = ({ status, label }) => {
  let className = 'pip';
  if (status === 'pass') {
    className += ' pip-green';
  } else if (status === 'warn') {
    className += ' pip-yellow';
  } else if (status === 'error') {
    className += ' pip-red';
  }

  return <span className={className}></span>;
};
