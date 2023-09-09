import React, { useEffect, useState } from 'react';
import {
  Stack, Fab
} from '@mui/material';
import { ZoomOutMap, ZoomInMap } from '@mui/icons-material';
import './App.css';
import styled from '@emotion/styled';
import StatTable from './components/StatTable';
import TestBrowser from './components/TestBrowser';

const App = () => {
  const [testToLoad, setTestToLoad] = useState(undefined);
  const [currentData, setCurrentData] = useState(undefined);
  const [compact, setCompact] = useState(true);

  useEffect(() => {
    if (testToLoad) {
      setTestToLoad(undefined);
    }
  }, [testToLoad]);

  const loadTest = testData => {
    setTestToLoad(testData);
  };

  return (
    <div className="App">
      <Stack direction={compact ? "column" : "row"}>
        <StatTable dataToLoad={testToLoad} onDataChanged={setCurrentData} compact={compact} />
        <TestBrowser onLoadTest={loadTest} currentData={currentData} compact={compact} />
      </Stack>
      <Fab variant="extended" size="small"
        sx={compact ? { position: 'absolute', bottom: '1em', left: '1em' } : {}}
        color="primary" onClick={() => setCompact(!compact)}>
        {compact ? <ZoomOutMap sx={{ mr: 1 }} /> : <ZoomInMap sx={{ mr: 1 }} />}
        {compact ? "Expand" : "Compact"}
      </Fab>
    </div>
  );
};

export default App;
