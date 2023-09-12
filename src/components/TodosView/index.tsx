import { ApolloClient, ApolloProvider, NormalizedCacheObject } from '@apollo/client';
import ListComponent from '../ListComponent';
import { useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import styles from './styles.module.css';
import CustomTabPanel from './CustomTabPanel';
import AccessControlTab from './AccessTab';

interface Props {
  apolloClient: ApolloClient<NormalizedCacheObject>;
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`
  };
}

function TodosView({ apolloClient }: Props) {
  const [currentTabIndex, setCurrentTabIndex] = useState(0);

  const handleTabChange = (_: unknown, newValue: number) => {
    setCurrentTabIndex(newValue);
  };

  return (
    <div className={styles.container}>
      <Tabs value={currentTabIndex} onChange={handleTabChange} aria-label="Todo list views">
        <Tab label="TODOs" {...a11yProps(0)} />
        <Tab label="Access" {...a11yProps(1)} />
      </Tabs>
      <ApolloProvider client={apolloClient}>
        <CustomTabPanel value={currentTabIndex} index={0}>
          <ListComponent />
        </CustomTabPanel>
        <CustomTabPanel value={currentTabIndex} index={1}>
          <AccessControlTab />
        </CustomTabPanel>
      </ApolloProvider>
    </div>
  );
}

export default TodosView;
