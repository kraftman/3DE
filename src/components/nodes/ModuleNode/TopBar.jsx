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
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      {!isCollapsed ? (
        <ToggleButtonGroup
          // value={settings}
          value={showRaw ? 'code' : 'nodes'}
          onChange={toggleShowRawCode}
          exclusive
          size="small"
          aria-label="text alignment"
        >
          <ToggleButton value="code" aria-label="justified" sx={{ minWidth: '30px', height: '30px', padding: 0, backgroundColor: '#333', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}>
            <CodeIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="nodes" aria-label="justified" sx={{ minWidth: '30px', height: '30px', padding: 0, backgroundColor: '#333', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}>
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
        <ToggleButton value="showEdges" aria-label="justified" sx={{ minWidth: '30px', height: '30px', padding: 0, backgroundColor: '#333', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}>
          <CommitIcon fontSize="small" />
        </ToggleButton>
      </ToggleButtonGroup> */}

      <ToggleButton
        value="check"
        aria-label="show childrem"
        size="small"
        selected={showChildren}
        onClick={() => toggleChildren()}
        sx={{ minWidth: '30px', height: '30px', padding: 0, backgroundColor: '#333', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}
      >
        <ReadMoreIcon fontSize="small" />
      </ToggleButton>

      <ToggleButton
        value="newFunction"
        aria-label="add new function"
        size="small"
        onClick={() => createNewFunction()}
        sx={{ minWidth: '30px', height: '30px', padding: 0, backgroundColor: '#333', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}
      >
        <AddIcon fontSize="small" />
      </ToggleButton>
    </div>
  );
};
