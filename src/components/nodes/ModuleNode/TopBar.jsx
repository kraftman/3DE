import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import CommitIcon from '@mui/icons-material/Commit';
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import PolylineIcon from '@mui/icons-material/Polyline';

export const TopBar = ({
  showRaw,
  toggleHidden,
  settings,
  handleToggle,
  openChildren,
}) => {
  return (
    <div>
      <ToggleButtonGroup
        // value={settings}
        value={showRaw ? 'code' : 'nodes'}
        onChange={toggleHidden}
        exclusive
        size="small"
        aria-label="text alignment"
      >
        <ToggleButton value="code" aria-label="justified">
          <CodeIcon fontSize="small" />
        </ToggleButton>
        <ToggleButton value="nodes" aria-label="justified">
          <PolylineIcon fontSize="small" />
        </ToggleButton>
      </ToggleButtonGroup>
      <ToggleButtonGroup
        value={settings}
        onChange={handleToggle}
        size="small"
        aria-label="text alignment"
      >
        <ToggleButton value="showEdges" aria-label="justified">
          <CommitIcon fontSize="small" />
        </ToggleButton>
      </ToggleButtonGroup>
      <ToggleButtonGroup
        // value={settings}
        onChange={openChildren}
        size="small"
        aria-label="text alignment"
      >
        <ToggleButton value="showEdges" aria-label="justified">
          <ReadMoreIcon fontSize="small" />
        </ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
};
