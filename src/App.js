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
  const [finalStats, setFinalStats] = useState({
    pp: 100, at: 100, df: 100
  });
  const [testToLoad, setTestToLoad] = useState(undefined);
  const [currentData, setCurrentData] = useState(undefined);
  const [compact, setCompact] = useState(true);

  useEffect(() => {
    if (testToLoad) {
      setTestToLoad(undefined);
    }
  }, [testToLoad]);

  const updateFinals = stats => {
    setFinalStats(stats);
  };

  const loadTest = testData => {
    setTestToLoad(testData);
  };

  return (
    <div className="App">
      <Stack direction={compact ? "column" : "row"}>
        <StatTable onCalculate={updateFinals} dataToLoad={testToLoad} onDataChanged={setCurrentData} compact={compact} />
        <TestBrowser onLoadTest={loadTest} currentData={currentData} finalStats={finalStats} compact={compact} />
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
