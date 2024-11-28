import React, { useState } from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CodeIcon from '@mui/icons-material/Code';
import VerticalSplitIcon from '@mui/icons-material/VerticalSplit';
import ArticleIcon from '@mui/icons-material/Article';

export const TitleBar = ({ view, handleViewChange }) => {
  return (
    <ToggleButtonGroup
      value={view}
      exclusive
      size="small"
      onChange={handleViewChange}
      aria-label="Markdown view toggle"
    >
      <ToggleButton value="raw" aria-label="raw markdown">
        <CodeIcon />
      </ToggleButton>
      <ToggleButton value="formatted" aria-label="formatted markdown">
        <ArticleIcon />
      </ToggleButton>
      <ToggleButton value="both" aria-label="side-by-side view">
        <VerticalSplitIcon />
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
