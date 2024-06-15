import React, { useState } from 'react';
import { Tabs, Tab, Box, Typography } from '@mui/material';
import { ScriptsPanel } from './ScriptsPanel';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2, backgroundColor: 'black', color: 'white' }}>
          <Typography variant="body2">{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export const TabComponent = ({ data }) => {
  const [value, setValue] = useState(1);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  console.log(data);
  const { settings } = data;
  console.log(settings);
  const title = settings.packageJson.name;

  return (
    <Box sx={{ width: '100%', backgroundColor: 'black', color: 'white' }}>
      <Typography variant="h6" align="center">
        {title}
      </Typography>
      <Tabs
        value={value}
        onChange={handleChange}
        aria-label="basic tabs example"
        textColor="inherit"
        TabIndicatorProps={{ style: { backgroundColor: 'white' } }}
        variant="fullWidth"
      >
        <Tab label="Scripts" {...a11yProps(0)} />
        <Tab label="Packages" {...a11yProps(1)} />
        <Tab label="Prettier" {...a11yProps(2)} />
        <Tab label="ESLint" {...a11yProps(3)} />
      </Tabs>
      <TabPanel value={value} index={0}>
        <ScriptsPanel />
      </TabPanel>
      <TabPanel value={value} index={1}>
        Content for Packages
      </TabPanel>
      <TabPanel value={value} index={2}>
        Content for Prettier
      </TabPanel>
      <TabPanel value={value} index={3}>
        Content for ESLint
      </TabPanel>
    </Box>
  );
};
