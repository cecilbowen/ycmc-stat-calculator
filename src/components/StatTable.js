import React, { useEffect, useState } from 'react';
import {
    TextField, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper,
    IconButton, Popper, Box, Fade
} from '@mui/material';
import PlayArrow from '@mui/icons-material/PlayArrowRounded';
import Remove from '@mui/icons-material/Remove';
import '../App.css';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import { calculateStats } from '../utils';
import { getAttributeTemplate, generateGridFromAttributes } from '../utils';
import * as Defaults from '../defaults';

const ArrowUpward = styled.div`
  position: absolute;
  transform: rotate(270deg) translateX(50%) translateY(50%);
  mask-image: url(/images/rightArrow.svg);
  mask-repeat: no-repeat;
  width: 20px;
  height: 20px;
  top: 42%;
  left: 50%;
  transform-origin: bottom left;
`;
const ArrowDownward = styled.div`
  position: absolute;
  transform: rotate(90deg) translateX(50%) translateY(50%);
  mask-image: url(/images/rightArrow.svg);
  mask-repeat: no-repeat;
  width: 20px;
  height: 20px;
  top: 57%;
  left: 50%;
  transform-origin: top right;
`;
const ArrowUpwardBorder = styled.div`
  position: absolute;
  transform: rotate(270deg) translateX(50%) translateY(50%);
  width: 26px;
  height: 26px;
  background-image: url(/images/rightArrow.svg);
  background-repeat: no-repeat;
  top: 38.5%;
  left: 50%;
  transform-origin: bottom left;
`;
const ArrowDownwardBorder = styled.div`
  position: absolute;
  transform: rotate(90deg) translateX(50%) translateY(50%);
  width: 26px;
  height: 26px;
  background-image: url(/images/rightArrow.svg);
  background-repeat: no-repeat;
  top: 58%;
  left: 50%;
  transform-origin: top right;
`;
const CapitalTD = styled.td`
    text-transform: capitalize;
`;

const CAN_EDIT_MODS = false;

const StatTable = ({ compact, onCalculate, dataToLoad, onDataChanged }) => {
    const [symbolAE, setSymbolAE] = useState(100);
    const [landAE, setLandAE] = useState(93);
    const [mapAE, setMapAE] = useState(108);

    const [basePP, setBasePP] = useState(157);
    const [baseAT, setBaseAT] = useState(135);
    const [baseDF, setBaseDF] = useState(26);

    const [finalPP, setFinalPP] = useState(100);
    const [finalAT, setFinalAT] = useState(100);
    const [finalDF, setFinalDF] = useState(100);

    const [uiAttributes, setUIAttributes] = useState(Defaults.ATTRIBUTES);

    const attributes = ["", "Light", "Dark", "Water", "Fire", "Earth", "Thunder", "Wood", "Wind"];
    const [monsterAttribute, setMonsterAttribute] = useState("Light");
    const [rows, setRows] = useState({
        ppRow: [0, 0, 0, 0, 0, 0, 0, 0],
        atRow: [0, 0, 0, 0, 0, 0, 0, 0],
        dfRow: [0, 0, 0, 0, 0, 0, 0, 0]
    });

    const [anchorEl, setAnchorEl] = useState(null);
    const [popperOpen, setPopperOpen] = useState(false);
    const [activeAttributeIndex, setActiveAttributeIndex] = useState(-1);

    const popperId = open ? 'att-popper' : undefined;
    const handlePopperClick = (ev, index, main) => {
        index = main ? -1 : index;
        const clickedOnSame = index === activeAttributeIndex;

        setActiveAttributeIndex(index); // just change position
        setAnchorEl(ev.currentTarget);
        setPopperOpen(!(popperOpen && clickedOnSame));
    };

    useEffect(() => {
        if (dataToLoad) {
            // load dataset into ui
            loadDataFromSet(dataToLoad);
        }
    }, [dataToLoad]);

    useEffect(() => {
        const data = prepareDataForCalculation();
        const stats = calculateStats(data);
        setFinalPP(stats.pp);
        setFinalAT(stats.at);
        setFinalDF(stats.df);
        onCalculate(stats);
        onDataChanged(data);
    }, [
        uiAttributes,
        symbolAE, landAE, mapAE,
        basePP, baseAT, baseDF,
        monsterAttribute,
        rows
    ]);

    useEffect(() => {
        const loadedGrid = generateGridFromAttributes(monsterAttribute, uiAttributes, [symbolAE, landAE, mapAE]);
        setRows({
            ppRow: loadedGrid.slice(0, 8),
            atRow: loadedGrid.slice(8, 16),
            dfRow: loadedGrid.slice(16)
        });
    }, [uiAttributes, monsterAttribute, symbolAE, landAE, mapAE]);

    const prepareDataForCalculation = () => {
        return {
            attribute: monsterAttribute,
            aeRate: [symbolAE, landAE, mapAE],
            base: [basePP, baseAT, baseDF],
            attributes: uiAttributes,
            grid: [
                ...rows.ppRow,
                ...rows.atRow,
                ...rows.dfRow
            ]
        };
    };

    const loadDataFromSet = set => {
        setMonsterAttribute(set.attribute);
        setSymbolAE(set.aeRate[0]);
        setLandAE(set.aeRate[1]);
        setMapAE(set.aeRate[2]);
        setBasePP(set.base[0]);
        setBaseAT(set.base[1]);
        setBaseDF(set.base[2]);

        setUIAttributes({ ...set.attributes });
    };

    const chooseAttribute = attribute => {
        if (activeAttributeIndex > -1) {
            const template = getAttributeTemplate();
            const indexTemplate = [0, 0, 1, 2, 0, 1, 2, 3]; // TODO: update if ever > 4 map attributes
            const index = indexTemplate[activeAttributeIndex];
            const field = template[activeAttributeIndex];

            const newUIAttributes = {
                symbol: { ...uiAttributes.symbol },
                landForm: [...uiAttributes.landForm.slice(0)],
                map: [...uiAttributes.map.slice(0)]
            };

            if (activeAttributeIndex === 0) {
                newUIAttributes[field] = {
                    attribute,
                    strength: newUIAttributes[field].strength
                };
            } else {
                const existingAtt = { ...newUIAttributes[field][index] };
                if (existingAtt) { // just update it
                    newUIAttributes[field][index] = {
                        attribute,
                        strength: existingAtt.strength
                    };
                } else { // doesn't exist, so make a new one
                    newUIAttributes[field].push({
                        attribute,
                        strength: 0
                    });
                }
            }
            setUIAttributes({ ...newUIAttributes });
        } else {
            setMonsterAttribute(attribute);
        }

        setPopperOpen(false); // close popper
    };

    const renderPopper = () => {
        return <Popper id={popperId}
            open={popperOpen} anchorEl={anchorEl} transition>
            {({ TransitionProps }) =>
                <Fade {...TransitionProps} timeout={350}>
                    <Paper elevation={4}
                        sx={{ borderRadius: '10px', marginTop: '0.5em', padding: '4px', backgroundColor: '#101418' }}>
                        {attributes.map((name, key) => {
                            const fileName = key === 0 ? "None" : name;

                            return <img key={key} src={`/images/attributes/${fileName}.png`}
                                title={name}
                                style={{ width: '30px', cursor: 'pointer', verticalAlign: 'middle', margin: '4px' }}
                                onClick={() => chooseAttribute(name)} />;
                        })}
                    </Paper>
                </Fade>
            }
        </Popper>;
    };

    const renderModCell = (mod, index, varName, changerFunc) => {
        const classes = getAttributeTemplate();
        let cls = classes[index];

        if (varName === "dfRow") {
            let bd = "";
            if (index === 0) { bd = " bd-bl"; }
            if (index === classes.length - 1) { bd = " bd-br"; }
            cls += bd;
        }

        let iconBorder;
        let icon = <Remove sx={{ marginTop: '3px' }} />;
        if (mod === 1) {
            iconBorder = <ArrowUpwardBorder />;
            icon = <ArrowUpward className="Green-Arrow" color="success" />;
        }
        if (mod === -1) {
            iconBorder = <ArrowDownwardBorder />;
            icon = <ArrowDownward className="Red-Arrow" color="error" />;
        }

        return <td align="right" key={index}
            className={cls}
            style={{
                textAlign: "center",
                verticalAlign: "middle",
                position: "relative",
                cursor: 'pointer'
            }} onClick={() => {
                if (!CAN_EDIT_MODS) { return; }
                let modVal = mod + 1;
                if (modVal > 1) { modVal = 0; }

                const newModList = rows[varName].slice(0);
                newModList[index] = modVal;

                changerFunc({
                    ...rows,
                    [varName]: newModList
                });
            }} onContextMenu={ev => {
                ev.preventDefault();
                if (!CAN_EDIT_MODS) { return; }
                let modVal = mod - 1;
                if (modVal < -1) { modVal = 0; }

                const newModList = rows[varName].slice(0);
                newModList[index] = modVal;

                changerFunc({
                    ...rows,
                    [varName]: newModList
                });
            }}
        >
            {iconBorder && iconBorder}
            {icon}
        </td>;
    };

    const renderAttributeCell = (attributeName, index, cls, main) => {
        attributeName = attributeName ? attributeName : 'None';
        const src = `/images/attributes/${main ? monsterAttribute || "None" : attributeName}.png`;

        cls = main ? "info2 bd-tr bd-br" : cls;
        return <td key={index} className={cls} title={attributeName}>
            <img
                style={{ width: '40px', cursor: 'pointer' }}
                src={src}
                onClick={ev => handlePopperClick(ev, index, main)}
            />
        </td>;
    };

    const renderAttributeCells = () => {
        const ret = [];
        const clsToAdd = {
            all: () => '',
            symbol: () => `symbol`,
            landForm: () => 'landForm',
            map: () => `map`,
        };

        const template = getAttributeTemplate();

        for (let i = 0; i < template.length; i++) {
            // classes
            const val = template[i];
            const numAt = template.slice(0, i + 1).filter(x => x === val).length;
            const cls = `${clsToAdd.all()} ${clsToAdd[val](numAt, template.filter(x => x === val))}`;

            // attributes
            let attributeName = "";
            const uiAtt = uiAttributes[val];
            if (uiAtt.attribute !== undefined) {
                // okay, this is the symbol
                attributeName = uiAtt.attribute;
            } else { // it's an array
                const uiAttEl = uiAtt[numAt - 1];
                if (uiAttEl) {
                    attributeName = uiAttEl.attribute;
                }
            }

            ret.push(renderAttributeCell(attributeName, i, cls, false));
        }

        return ret;
    };

    const renderAttributeHeaders = () => {
        const ret = [];
        const clsToAdd = {
            all: () => 'dataLabel title',
            symbol: (i, arr) => `symbol ${i === arr.length && 'bd-tl'}`,
            landForm: () => 'landForm',
            map: (i, arr) => `map ${i === arr.length && 'bd-tr'}`,
        };

        const alias = {
            symbol: "symbol",
            landForm: "land",
            map: "map"
        };
        const template = getAttributeTemplate();

        for (let i = 0; i < template.length; i++) {
            const val = template[i];
            const numAt = template.slice(0, i + 1).filter(x => x === val).length;
            const cls = `${clsToAdd.all()} ${clsToAdd[val](numAt, template.filter(x => x === val))}`;
            ret.push(
                <CapitalTD key={i} className={cls} component="th" scope="row">{`${alias[val]} ${numAt}`}</CapitalTD>
            );
        }

        return ret;
    };

    const renderAttributeStrengths = () => {
        const ret = [];
        const clsToAdd = {
            all: () => '',
            symbol: () => `symbol`,
            landForm: () => 'landForm',
            map: () => `map`,
        };

        const template = getAttributeTemplate();

        for (let i = 0; i < template.length; i++) {
            // classes
            const val = template[i];
            const numAt = template.slice(0, i + 1).filter(x => x === val).length;
            const cls = `${clsToAdd.all()} ${clsToAdd[val](numAt, template.filter(x => x === val))}`;

            // strengths
            let strength = 0;
            const uiAtt = uiAttributes[val];
            let cantEdit = false;
            if (uiAtt.attribute !== undefined) {
                // okay, this is the symbol
                strength = uiAtt.strength;
            } else {
                const uiAttEl = uiAtt[numAt - 1];
                if (uiAttEl) {
                    cantEdit = uiAttEl.attribute.length === 0;
                    strength = uiAttEl.strength;
                } else {
                    cantEdit = true;
                }
            }

            ret.push(
                <td className={cls} key={i}>
                    <input
                        className={`dataInput ${cls}`}
                        type="number"
                        min={0}
                        max={100}
                        value={strength}
                        data-var={val}
                        data-index={numAt - 1}
                        onChange={ev => {
                            if (cantEdit) { return; }
                            const value = parseInt(ev.target.value, 10);
                            const field = ev.target.getAttribute("data-var");
                            const index = parseInt(ev.target.getAttribute("data-index"), 10);

                            const newUIAttributes = {
                                symbol: { ...uiAttributes.symbol },
                                landForm: [...uiAttributes.landForm.slice(0)],
                                map: [...uiAttributes.map.slice(0)]
                            };

                            if (field === "symbol") {
                                newUIAttributes[field] = {
                                    attribute: newUIAttributes[field].attribute,
                                    strength: value
                                };
                            } else {
                                newUIAttributes[field][index] = {
                                    attribute: newUIAttributes[field][index].attribute,
                                    strength: value
                                };
                            }
                            setUIAttributes({ ...newUIAttributes });
                        }}
                    />
                </td>
            );
        }

        return ret;
    };

    const paperMargin = compact ? '0px' : '1em';
    const tableMargin = compact ? '0px' : '1em';

    return <Paper sx={{ margin: paperMargin, width: 'fit-content', padding: '2px', backgroundColor: '#fff6c5' }}>
        <table style={{
            minWidth: 650, maxWidth: compact ? '770px' : 'initial',
            margin: tableMargin, borderSpacing: '0'
        }} size="small">
            <tbody>
                <tr>
                    <td align="right" className="dataLabel title pd bd-tl info" component="th" scope="row">Symbol %</td>
                    <td className="info2 bd-tr">
                        <input
                            className="dataInput"
                            type="number"
                            variant="outlined"
                            value={symbolAE}
                            tabIndex={1}
                            onChange={event => setSymbolAE(parseInt(event.target.value, 10))}
                        />
                    </td>
                    <td></td>
                    <td align="right"
                        style={{ fontSize: '12px' }}
                        className="dataLabel title pd bd-tl bd-bl info"
                        component="th" scope="row">Monster Attribute</td>
                    {renderAttributeCell(monsterAttribute, 0, "", true)}
                    <td></td>
                    <td className="final bbd">
                        <TextField
                            className="dataInputFinal"
                            style={compact ? { width: 'initial' } : {}}
                            label="Final PP"
                            variant="outlined"
                            value={finalPP}
                            size="small"
                        />
                    </td>
                    <td className="final bbd">
                        <TextField
                            className="dataInputFinal"
                            style={compact ? { width: 'initial' } : {}}
                            label="Final AT"
                            variant="outlined"
                            value={finalAT}
                            size="small"
                        />
                    </td>
                    <td className="final bbd">
                        <TextField
                            className="dataInputFinal"
                            style={compact ? { width: 'initial' } : {}}
                            label="Final DF"
                            variant="outlined"
                            value={finalDF}
                            size="small"
                        />
                    </td>
                </tr>
                <tr>
                    <td align="right" className="dataLabel title pd bd info" component="th" scope="row">Land %</td>
                    <td className="info2">
                        <input
                            className="dataInput"
                            type="number"
                            variant="outlined"
                            value={landAE}
                            tabIndex={2}
                            onChange={event => setLandAE(parseInt(event.target.value, 10))}
                        />
                    </td>
                </tr>
                <tr>
                    <td align="right" className="dataLabel title pd bd info" component="th" scope="row">Map %</td>
                    <td className="info2">
                        <input
                            className="dataInput"
                            type="number"
                            variant="outlined"
                            value={mapAE}
                            tabIndex={3}
                            onChange={event => setMapAE(parseInt(event.target.value, 10))}
                        />
                    </td>
                    {renderAttributeHeaders()}
                </tr>

                <tr>
                    <td className="info"></td>
                    <td className="info"></td>
                    {renderAttributeCells()}
                </tr>

                <tr>
                    <td className="info"></td>
                    <td className="info"></td>
                    {renderAttributeStrengths()}
                </tr>

                <tr>
                    <td align="right" className="dataLabel title pd bd info" component="th" scope="row">Base PP</td>
                    <td className="info2">
                        <input
                            className="dataInput"
                            type="number"
                            variant="outlined"
                            value={basePP}
                            tabIndex={4}
                            onChange={event => setBasePP(parseInt(event.target.value, 10))}
                        />
                    </td>
                    {rows.ppRow.map((x, i) => renderModCell(x, i, "ppRow", setRows))}
                </tr>
                <tr>
                    <td align="right" className="dataLabel title pd bd info" component="th" scope="row">Base AT</td>
                    <td className="info2">
                        <input
                            className="dataInput"
                            type="number"
                            variant="outlined"
                            value={baseAT}
                            tabIndex={5}
                            onChange={event => setBaseAT(parseInt(event.target.value, 10))}
                        />
                    </td>
                    {rows.atRow.map((x, i) => renderModCell(x, i, "atRow", setRows))}
                </tr>
                <tr>
                    <td align="right" className="dataLabel title pd bd-bl info" component="th" scope="row">Base DF</td>
                    <td className="info2 bd-br">
                        <input
                            className="dataInput"
                            type="number"
                            variant="outlined"
                            value={baseDF}
                            tabIndex={6}
                            onChange={event => setBaseDF(parseInt(event.target.value, 10))}
                        />
                    </td>
                    {rows.dfRow.map((x, i) => renderModCell(x, i, "dfRow", setRows))}
                </tr>
            </tbody>
        </table>
        {renderPopper()}
    </Paper>;
};
StatTable.propTypes = {
    onCalculate: PropTypes.func.isRequired,
    dataToLoad: PropTypes.object,
    onDataChanged: PropTypes.func,
    compact: PropTypes.bool
};
export default StatTable;
