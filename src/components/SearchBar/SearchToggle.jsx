import React, { useState } from 'react';
import { ToggleButtonGroup, ToggleButton } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import FunctionsIcon from '@mui/icons-material/Functions';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';

export const SearchToggle = ({ setSearchMode, searchMode }) => {
  const handleToggle = (event, newMode) => {
    if (newMode !== null) {
      setSearchMode(newMode);
    }
  };

  return (
    <ToggleButtonGroup
      value={searchMode}
      exclusive
      onChange={handleToggle}
      aria-label="search mode"
    >
      <ToggleButton value="filenames" aria-label="search filenames">
        <DescriptionIcon />
      </ToggleButton>
      <ToggleButton value="functions" aria-label="search functions">
        <FunctionsIcon />
      </ToggleButton>
      <ToggleButton value="codebase" aria-label="search entire codebase">
        <AllInclusiveIcon />
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
