/* eslint-disable lines-around-comment */
import ATTRIBUTE_CHART_SYMBOL from './data/attributeMatchups_symbol_effect-monster.json';
import ATTRIBUTE_CHART_LANDFORM from './data/attributeMatchups_landForm_effect-monster.json';
import ATTRIBUTE_CHART_MAP from './data/attributeMatchups_map_effect-monster.json';
import * as Defaults from './defaults';

/*
    test data template (old)
    {
        "attribute": "xxx",
        "aeRate": [xxx, xxx, xxx],
        "base": [xxx, xxx, xxx],
        "final": [xxx, xxx, xxx],
        "attributes": ["xxx", "xxx", "xxx", "xxx", "xxx", "xxx", "xxx"],
        "strengths": [0, 0, 0, 0, 0, 0, 0],
        "grid": [
            0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0
        ]
    },
*/

export const getAttributeTemplate = () => {
    const s = Array(Defaults.MAX.SYMBOL).fill("symbol");
    const l = Array(Defaults.MAX.LAND).fill("landForm");
    const m = Array(Defaults.MAX.MAP).fill("map");
    return [...s, ...l, ...m];
};

export const calculateStats = data => {
    const A = 0;
    const B = 8;
    const C = 16;
    const leniency = 3; // will pass tests if values are within this much of expected values

    const grid = data.grid || generateGridFromAttributes(data.attribute, data.attributes);
    const atts = data.attributes;
    const flatAttributes = [
        [atts.symbol][0],
        atts.landForm[0], atts.landForm[1], atts.landForm[2],
        atts.map[0], atts.map[1], atts.map[2], atts.map[3]
    ];
    const template = getAttributeTemplate();
    const indexTemplate = [0, 0, 1, 2, 0, 1, 2, 3];
    const ae = {
        symbol: data.aeRate[0],
        landForm: data.aeRate[1],
        map: data.aeRate[2]
    };
    const base = {
        pp: data.base[0],
        at: data.base[1],
        df: data.base[2]
    };

    const ppSum = [base.pp];
    const atSum = [base.at];
    const dfSum = [base.df];
    for (let i = 0; i < flatAttributes.length; i++) {
        const attr = flatAttributes[i];
        const ind = indexTemplate[i];
        const t = template[i];
        // ppSum.push(getStatMod(ae[t], attr, base.pp, grid[A + i], 1));
        // atSum.push(getStatMod(ae[t], attr, base.at, grid[B + i], 1));
        // dfSum.push(getStatMod(ae[t], attr, base.df, grid[C + i], 1));

        ppSum.push(getStatModMap(ae[t], attr, base.pp, grid[A + i], t));
        atSum.push(getStatModMap(ae[t], attr, base.at, grid[B + i], t));
        dfSum.push(getStatModMap(ae[t], attr, base.df, grid[C + i], t));
    }

    const pp = ppSum.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    const at = atSum.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    const df = dfSum.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

    let tests;
    if (data.final) { // it's a test, so compare values to expected values
        const ppDiff = Math.abs(data.final[0] - Math.floor(pp));
        const atDiff = Math.abs(data.final[1] - Math.floor(at));
        const dfDiff = Math.abs(data.final[2] - Math.floor(df));
        const [passPP, passAT, passDF] = [ppDiff <= leniency, atDiff <= leniency, dfDiff <= leniency];
        const [perfectPP, perfectAT, perfectDF] = [ppDiff === 0, atDiff === 0, dfDiff === 0];
        const [noChangePP, noChangeAT, noChangeDF] = [pp === base.pp, at === base.at, df === base.df];
        const all = passPP && passAT && passDF;
        tests = {
            all, passPP, passAT, passDF,
            perfectPP, perfectAT, perfectDF,
            noChangePP, noChangeAT, noChangeDF
        };
    }

    return {
        pp, at, df, tests
    };
};

export const getStatModMap = (ae, attribute, base, type = 1, column) => {
    if (!attribute) { return 0; }
    const attributeStrength = attribute.strength;
    const attributeName = attribute.attribute;
    if (type === 0 || attributeStrength === 0 || !attributeName) { return 0; } // no stat change

    let mod = 4;
    if (column === 'symbol') { mod = 1; }
    if (column === 'land') { mod = 4; }

    let percent = ae / 100;
    percent *= attributeStrength;
    percent /= 100;
    percent *= base;
    percent /= mod;
    return percent * type;
};

export const getStatMod = (ae, attribute, base, type = 1, mod = 1) => {
    if (!attribute) { return 0; }
    const attributeStrength = attribute.strength;
    const attributeName = attribute.attribute;
    if (type === 0 || attributeStrength === 0 || !attributeName) { return 0; } // no stat change
    // const debuff = type === -1; // 1 for buff, -1 for debuff, 0 for no change

    const percent = ae / 100 * attributeStrength;
    // let mod = 1;

    // if (debuff) {
    // mod = 2;
    // }

    // const basePercent = percent / mod;
    const basePercent = percent;
    // const baseMod = (basePercent / 100) * base * type;
    const baseMod = basePercent / 100 * base * type / mod;
    // const finalStat = base + baseMod;

    // if (debuff) {
    // return Math.floor(baseMod);
    // }

    // return Math.ceil(baseMod);
    return baseMod;
};

export const getStatChangesFromAttributes = (source, effectAttribute, monsterAttributeName) => {
    let chart = ATTRIBUTE_CHART_SYMBOL;
    if (source === "land") {
        chart = ATTRIBUTE_CHART_LANDFORM;
    } else if (source === "map") {
        chart = ATTRIBUTE_CHART_MAP;
    }

    const effectAttributeName = effectAttribute.attribute;
    const strength = effectAttribute.strength;

    let statChanges = {
        attribute: effectAttributeName,
        pp: 0, at: 0, df: 0
    };

    if (!effectAttributeName || !monsterAttributeName || strength <= 0) {
        return statChanges;
    }

    let increase = false;
    let statChangesStr = chart[effectAttributeName][monsterAttributeName];
    if (statChangesStr) {
        statChangesStr = statChangesStr.toLowerCase();
        increase = statChangesStr.includes('+');
        const incMod = increase ? 1 : -1;
        statChanges = {
            attribute: effectAttributeName,
            pp: statChangesStr.includes('pp') ? incMod : 0,
            at: statChangesStr.includes('at') ? incMod : 0,
            df: statChangesStr.includes('df') ? incMod : 0,
        };
    }

    return statChanges;
};

export const generateGridFromAttributes = (monsterAttribute, attributes) => {
    const grid = Array(24).fill(0);

    const ez = {
        symbol: getStatChangesFromAttributes('symbol', attributes.symbol, monsterAttribute),
        landForm: attributes.landForm.map(x => getStatChangesFromAttributes('land', x, monsterAttribute)),
        map: attributes.map.map(x => getStatChangesFromAttributes('map', x, monsterAttribute))
    };

    /*
        0, 8, 16 - symbol pp, at, df
        1, 9, 17 - land1 pp, at, df
        2, 10, 18 - land2 pp, at, df
        3, 11, 19 - land3 pp, at, df
        4, 12, 20 - map1 pp, at, df
        5, 13, 21 - map2 pp, at, df
        6, 14, 22 - map3 pp, at, df
        7, 15, 23 - map4 pp, at, df
    */

    grid[0] = ez.symbol.pp; grid[8] = ez.symbol.at; grid[16] = ez.symbol.df;
    for (let i = 0; i < ez.landForm.length; i++) {
        const val = ez.landForm[i];
        grid[i + 1] = val.pp; grid[i + 9] = val.at; grid[i + 17] = val.df;
    }
    for (let i = 0; i < ez.map.length; i++) {
        const val = ez.map[i];
        grid[i + 4] = val.pp; grid[i + 12] = val.at; grid[i + 20] = val.df;
    }

    return grid;
};
