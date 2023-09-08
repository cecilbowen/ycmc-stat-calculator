import React, { useEffect, useState } from 'react';
import {
    TextField,
    Paper, InputAdornment,
    IconButton, List,
    ListItemIcon, ListItemText, Divider, ListItem,
    Stack, Button, ListSubheader
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import CachedIcon from '@mui/icons-material/Cached';
import TagFacesIcon from '@mui/icons-material/TagFaces';
import '../App.css';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import { calculateStats } from '../utils';
import ConfirmBox from './ConfirmBox';
import TEST_SET_1 from '../data/test-set-v2.json';

const FixedTextField = styled(TextField)`
    & input {
        text-align: initial;
        font-family: inherit;
        font-size: 14px;
        -moz-appearance: auto;        
    }
`;
const MyListSubheader = styled(ListSubheader)`
  line-height: 2em;
  border-radius: 10px;
  background-color: #a5d5ff;
`;

const PERFECT_PASS_EMOJI = '✅';
const NO_CHANGE_EMOJI = '➖';
const PASS_EMOJI = '☑️';
const FAIL_EMOJI = '❌';

const TestBrowser = ({ compact, currentData, finalStats, onLoadTest }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [sets, setSets] = useState([...TEST_SET_1]);
    const [customSets, setCustomSets] = useState([]);
    const [newSetName, setNewSetName] = useState("");
    const [newFinals, setNewFinals] = useState([0, 0, 0]);
    const [idToDelete, setIdToDelete] = useState(undefined);
    const [idToOverwrite, setIdToOverwrite] = useState(undefined);
    const [allTestsPassed, setAllTestsPassed] = useState(false);

    useEffect(() => {
        const items = JSON.parse(localStorage.getItem('customSets'));
        if (items) {
            setCustomSets(items.map(x => {
                return { // cause don't load tests
                    id: x.id,
                    attribute: x.attribute,
                    aeRate: x.aeRate,
                    base: x.base,
                    final: x.final,
                    attributes: x.attributes,
                    grid: x.grid,
                    name: x.name,
                    tests: undefined
                };
            }));
        }
    }, []);

    useEffect(() => {
        for (const set of sets) {
            set.tests = getTests(set);
        }
    }, [sets]);
    useEffect(() => {
        setNewSetName(`Test Set #${sets.length + customSets.length + 1}`);
        for (const set of customSets) {
            set.tests = getTests(set);
        }
    }, [customSets]);

    useEffect(() => {
        if (currentData) {
            // setNewFinals([currentData.base[0], currentData.base[1], currentData.base[2]]);
        }
    }, [currentData]);

    const getTests = set => {
        console.log("finfa", set);
        const stats = calculateStats(set);
        return stats.tests;
    };

    const reTestAll = () => {
        let allPass = true;
        for (const set of sets) {
            const tests = getTests(set);
            if (!tests.all) { allPass = false; }
            // set.tests = tests;
        }
        for (const set of customSets) {
            const tests = getTests(set);
            if (!tests.all) { allPass = false; }
            // set.tests = tests;
        }
        setAllTestsPassed(allPass);

        // trigger re-rendering
        setCustomSets([...customSets]);
        setSets([...sets]);
    };

    const handleListItemClick = (event, index, set, load) => {
        setSelectedIndex(index);

        if (load) {
            onLoadTest(set);
            setNewSetName(set.name || `Test Set #${sets.length + customSets.length + 1}`);
            setTimeout(() => setNewFinals(set.final), 300);
        }
    };

    const saveNewSet = overwrite => {
        let tempCustomSets = [...customSets.slice(0)];
        const mostRecent = tempCustomSets.slice(0).sort((a, b) => b.id - a.id)[0];
        const newId = (mostRecent?.id || -1) + 1;
        const name = newSetName || `Test Set #${sets.length + customSets.length + 1}`;
        const newSet = {
            ...currentData,
            final: newFinals,
            name
        };
        console.log("fuck", currentData);

        if (overwrite) {
            closeModal();
            tempCustomSets = [];
            const indexToOverwrite = selectedIndex - sets.length;
            for (let i = 0; i < customSets.length; i++) {
                if (i !== indexToOverwrite) {
                    tempCustomSets.push({
                        ...customSets[i]
                    });
                } else {
                    newSet.id = customSets[i].id;
                    tempCustomSets.push(newSet);
                }
            }
        } else {
            newSet.id = newId;
            tempCustomSets.push(newSet);
        }

        setCustomSets(tempCustomSets);
        if (!overwrite) { setSelectedIndex(sets.length + tempCustomSets.length - 1); }
        localStorage.setItem('customSets', JSON.stringify(tempCustomSets));
    };

    const deleteSet = () => {
        const tempCustomSets = customSets.filter(x => x.id !== idToDelete);
        setCustomSets(tempCustomSets);
        localStorage.setItem('customSets', JSON.stringify(tempCustomSets));
        closeModal();
        setSelectedIndex(undefined); // or could set it to first or last one
    };

    const showOverwriteModal = () => {
        const set = customSets[selectedIndex - sets.length];
        if (set !== undefined) {
            setIdToOverwrite(set.id);
        }
    };

    const closeModal = () => {
        setIdToDelete(undefined);
        setIdToOverwrite(undefined);
    };

    const renderDeleteConfirm = () => {
        const index = selectedIndex - sets.length;
        const name = customSets[index]?.name || "";

        return <ConfirmBox
            open={idToDelete !== undefined}
            title={`Deleting "${name || "Data Set"}"`}
            text="Are you sure you want to delete this data set?"
            confirmText={"Delete"}
            onConfirm={() => deleteSet()}
            onCancel={() => closeModal()}
        />;
    };

    const renderOverwriteConfirm = () => {
        const name = customSets.filter(x => x.id === idToOverwrite)[0]?.name;

        return <ConfirmBox
            open={idToOverwrite !== undefined}
            title={`Overwriting "${name || "Data Set"}"`}
            text="Are you sure you want to overwrite this data set?"
            confirmText={"Overwrite"}
            onConfirm={() => saveNewSet(true)}
            onCancel={() => closeModal()}
        />;
    };

    const emoji = (passed, perfect, noChange) => {
        if (noChange) {
            return NO_CHANGE_EMOJI;
        } else if (perfect) {
            return PERFECT_PASS_EMOJI;
        } else if (passed) {
            return PASS_EMOJI;
        }

        console.log("passed, perfect, noChange", passed, perfect, noChange);
        return FAIL_EMOJI;
    };

    const height = compact ? '42vh' : '30vh';
    const maxWidth = compact ? 'initial' : '30em';
    const margin = compact ? '1em 0em 0em 0em' : '1em';

    const renderListItem = (set, index, isCustom) => {
        index = isCustom ? sets.length + index : index;

        let backgroundColor = index % 2 === 0 ? "#e0e7ef !important" : "";
        const selected = selectedIndex === index;
        backgroundColor = selected ? "#adcbe9 !important" : backgroundColor;

        let testEmoji = '';
        if (set.tests) {
            testEmoji = `${emoji(set.tests.passPP, set.tests.perfectPP, set.tests.noChangePP)}` +
                `${emoji(set.tests.passAT, set.tests.perfectAT, set.tests.noChangeAT)}` +
                `${emoji(set.tests.passDF, set.tests.perfectDF, set.tests.noChangeDF)}`;
        }

        const displayName = `${index + 1}. ${set.name || `Test Set #${index + 1}`}`;

        return <ListItem
            key={index}
            // selected={selected}
            onClick={event => handleListItemClick(event, index, set)}
            onDoubleClick={event => handleListItemClick(event, index, set, true)}
            sx={{ backgroundColor, cursor: 'pointer' }}
            className="noselect"
            secondaryAction={isCustom &&
                <IconButton
                    onClick={() => setIdToDelete(set.id)}
                    edge="end"
                    aria-label="delete">
                    <DeleteIcon color="error" />
                </IconButton>
            }
        >
            <ListItemIcon>
                <img
                    src={`/images/attributes/${set.attribute}.png`}
                    style={{ width: '30px' }}
                />
            </ListItemIcon>
            <ListItemText primary={displayName} secondary={testEmoji} />
        </ListItem>;
    };

    const renderList = () => {
        return <List component="nav" aria-label="test browser" dense
            subheader={<li />}
            sx={{ overflowY: 'auto', height, margin: compact ? '1em 0em' : '', width: compact ? '25em' : '100%' }}>
            <MyListSubheader>Original Test Sets</MyListSubheader>
            {sets.map((x, i) => renderListItem(x, i))}
            {customSets.length > 0 && <MyListSubheader>Custom Test Sets</MyListSubheader>}
            {customSets.map((x, i) => renderListItem(x, i, true))}
        </List>;
    };

    const renderFinalStack = direction => {
        const textStyle = compact ? { marginBottom: '1em' } : { marginRight: '1em' };
        const finale = finalStats || { pp: 0, at: 0, df: 0 };
        const gotA = Math.round(finale.pp);
        const gotB = Math.round(finale.at);
        const gotC = Math.round(finale.df);

        return <Stack direction={direction} sx={{ margin: '1em', width: compact ? '9em' : 'initial' }}>
            <FixedTextField
                type="number"
                variant="outlined"
                label="Expected - (Actual)"
                value={newFinals[0]}
                onChange={ev => setNewFinals([parseInt(ev.target.value, 10), newFinals[1], newFinals[2]])}
                size="small"
                sx={textStyle}
                InputProps={{
                    // endAdornment: <InputAdornment sx={diffStyle(diffA)} position="end">{signA}{diffA}</InputAdornment>,
                    startAdornment: <InputAdornment className="adornLabel"
                        position="start">PP:</InputAdornment>,
                    endAdornment: <InputAdornment className={`adorn ${gotA === newFinals[0] ? 'correct' : 'wrong'}`}
                        position="end">{`(${gotA})`}</InputAdornment>,
                    // tabIndex: 7
                }}
            />
            <FixedTextField
                type="number"
                variant="outlined"
                label="Expected - (Actual)"
                value={newFinals[1]}
                onChange={ev => setNewFinals([newFinals[0], parseInt(ev.target.value, 10), newFinals[2]])}
                size="small"
                sx={textStyle}
                InputProps={{
                    startAdornment: <InputAdornment className="adornLabel"
                        position="start">AT:</InputAdornment>,
                    endAdornment: <InputAdornment className={`adorn ${gotB === newFinals[1] ? 'correct' : 'wrong'}`}
                        position="end">{`(${gotB})`}</InputAdornment>,
                    // tabIndex: 8
                }}
            />
            <FixedTextField
                type="number"
                variant="outlined"
                label="Expected - (Actual)"
                value={newFinals[2]}
                onChange={ev => setNewFinals([newFinals[0], newFinals[1], parseInt(ev.target.value, 10)])}
                size="small"
                sx={textStyle}
                InputProps={{
                    startAdornment: <InputAdornment className="adornLabel"
                        position="start">DF:</InputAdornment>,
                    endAdornment: <InputAdornment className={`adorn ${gotC === newFinals[2] ? 'correct' : 'wrong'}`}
                        position="end">{`(${gotC})`}</InputAdornment>,
                    // tabIndex: 9
                }}
            />
        </Stack>;
    };

    const renderOptionStack = direction => {
        const innerStyle = compact ? { marginBottom: '1em' } : { marginRight: '1em' };

        return <Stack direction={direction} sx={{ margin: '1em' }}>
            <TextField
                type="text"
                variant="outlined"
                label="New Set Name"
                value={newSetName}
                onChange={ev => setNewSetName(ev.target.value)}
                size="small"
                sx={{ width: '10em', ...innerStyle }}
            />
            <Button
                type="button"
                variant="outlined"
                onClick={() => saveNewSet()}
                disabled={newFinals[0] + newFinals[1] + newFinals[2] < 3}
                sx={{ cursor: 'pointer', ...innerStyle }}
                size="small"
            >Save New</Button>
            <Button
                type="button"
                variant="outlined"
                onClick={() => showOverwriteModal()}
                disabled={newFinals[0] + newFinals[1] + newFinals[2] < 3 ||
                    selectedIndex === undefined || selectedIndex < sets.length}
                sx={{ cursor: 'pointer', ...innerStyle }}
                size="small"
                color="secondary"
            >Overwrite</Button>
            <IconButton aria-label="retest" color="info"
                title="Re-Run Tests" onClick={reTestAll}>
                {allTestsPassed ? <TagFacesIcon color="success" /> : <CachedIcon />}
            </IconButton>
        </Stack>;
    };

    const renderNormal = () => {
        return <Stack direction="column">
            {renderList()}
            {renderFinalStack("row")}
            {renderOptionStack("row")}
        </Stack>;
    };

    const renderCompact = () => {
        return <Stack direction="row">
            {renderFinalStack("column")}
            {renderList()}
            {renderOptionStack("column")}
        </Stack>;
    };

    return <Paper
        elevation={2}
        sx={{
            width: 'fit-content',
            maxWidth,
            margin,
            backgroundColor: '#dee9f4'
        }}>
        {compact && renderCompact()}
        {!compact && renderNormal()}
        {renderDeleteConfirm()}
        {renderOverwriteConfirm()}
    </Paper>;
};

TestBrowser.propTypes = {
    onLoadTest: PropTypes.func.isRequired,
    currentData: PropTypes.object,
    compact: PropTypes.bool,
    finalStats: PropTypes.object
};
export default TestBrowser;