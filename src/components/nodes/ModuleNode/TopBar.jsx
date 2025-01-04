import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import CommitIcon from '@mui/icons-material/Commit';
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import PolylineIcon from '@mui/icons-material/Polyline';
import AddIcon from '@mui/icons-material/Add';
import { Dashboard } from '@mui/icons-material';

export const TopBar = ({
  showRaw,
  toggleShowRawCode,
  toggleChildren,
  showChildren,
  isCollapsed,
  createNewFunction,
}) => {
  const toggleChildrenValue = showChildren ? 'showChildren' : 'hideChildren';
  return (
    <div>
      {!isCollapsed ? (
        <ToggleButtonGroup
          // value={settings}
          value={showRaw ? 'code' : 'nodes'}
          onChange={toggleShowRawCode}
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
      ) : null}

      {/*  <ToggleButtonGroup
        value={settings}
        onChange={handleToggle}
        size="small"
        aria-label="text alignment"
      >
        <ToggleButton value="showEdges" aria-label="justified">
          <CommitIcon fontSize="small" />
        </ToggleButton>
      </ToggleButtonGroup> */}

      <ToggleButton
        value="check"
        aria-label="show childrem"
        size="small"
        selected={showChildren}
        onClick={() => toggleChildren()}
      >
        <ReadMoreIcon fontSize="small" />
      </ToggleButton>

      <ToggleButton
        value="newFunction"
        aria-label="add new function"
        size="small"
        onClick={() => createNewFunction()}
      >
        <AddIcon fontSize="small" />
      </ToggleButton>
    </div>
  );
};
