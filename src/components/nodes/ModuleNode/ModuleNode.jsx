import React from 'react';
import { NodeResizer } from 'reactflow';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#aaaaaa',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
});

export const ModuleNode = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <NodeResizer
        minWidth={300}
        minHeight={300}
        style={{ background: 'none' }}
      />
      <div
        className="text-updater-node"
        style={{ background: '#121212', padding: '16px', borderRadius: '8px' }}
      >
        <div className="function-node-accordions">
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon style={{ color: '#ffffff' }} />}
              aria-controls="context-content"
              id="context-header"
            >
              <Typography>Context</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <div></div>
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon style={{ color: '#ffffff' }} />}
              aria-controls="imports-content"
              id="imports-header"
            >
              <Typography>Imports</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <div></div>
            </AccordionDetails>
          </Accordion>
        </div>
      </div>
    </ThemeProvider>
  );
};
