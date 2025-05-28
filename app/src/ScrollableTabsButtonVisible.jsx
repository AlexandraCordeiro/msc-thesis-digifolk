import * as React from 'react';
import Box from '@mui/material/Box';
import Tabs, { tabsClasses } from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

export default function ScrollableTabsButtonVisible({options, tune, handleChange}) {

  return (
    <Box
      sx={{
        flexGrow: 1,
        maxWidth: { xs: 320, sm: 600},
      }}
    >
      <Tabs
        value={tune}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons='auto'
        aria-label="visible arrows tabs example"
        sx={{
          [`& .${tabsClasses.scrollButtons}`]: {color:'black',
            '&.Mui-disabled': { opacity: 0.3},
          },
        }}
      >
        {options.map((option) => (
            <Tab
                key={option}
                sx={{ fontFamily: 'Montserrat', fontSize: '12px', fontWeight: '450'}}
                label={option}
                value={option}
            />

        ))}
      </Tabs>
    </Box>
  );
}