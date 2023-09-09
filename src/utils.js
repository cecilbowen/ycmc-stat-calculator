/* eslint-disable lines-around-comment */
import ATTRIBUTE_CHART_SYMBOL from './data/attributeMatchups_symbol_effect-monster.json';
import ATTRIBUTE_CHART_LANDFORM from './data/attributeMatchups_landForm_effect-monster.json';
import ATTRIBUTE_CHART_MAP from './data/attributeMatchups_map_effect-monster.json';
import ATTRIBUTE_BOOSTS from './data/attributeBoosts.json';
import * as Defaults from './defaults';

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

    const ae = {
        symbol: data.aeRate[0],
        landForm: data.aeRate[1],
        map: data.aeRate[2]
    };
    const grid = data.grid || generateGridFromAttributes(data.attribute, data.attributes, [ae.symbol, ae.landForm, ae.map]);
    const atts = data.attributes;
    const flatAttributes = [
        [atts.symbol][0],
        atts.landForm[0], atts.landForm[1], atts.landForm[2],
        atts.map[0], atts.map[1], atts.map[2], atts.map[3]
    ];
    const template = getAttributeTemplate();
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
        const column = template[i]; // symbol, landForm or map

        ppSum.push(getStatModMap(ae[column], attr, data.attribute, base.pp, grid[A + i], column));
        atSum.push(getStatModMap(ae[column], attr, data.attribute, base.at, grid[B + i], column));
        dfSum.push(getStatModMap(ae[column], attr, data.attribute, base.df, grid[C + i], column));
    }

    // floor() if decrease, ceil() if increase
    let pp = ppSum.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    let at = atSum.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    let df = dfSum.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

    const noDecimals = true;

    if (noDecimals) {
        pp = pp > base.pp ? Math.ceil(pp) : Math.floor(pp);
        at = at > base.at ? Math.ceil(at) : Math.floor(at);
        df = df > base.df ? Math.ceil(df) : Math.floor(df);
    }

    let tests;
    if (data.final) { // it's a test, so compare values to expected values
        const ppDiff = Math.abs(data.final[0] - pp);
        const atDiff = Math.abs(data.final[1] - at);
        const dfDiff = Math.abs(data.final[2] - df);
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

/*
    ae - effect rate percent
    attribute - { attribute: "Earth", strength: 40 }
    base - actual base stat (pp, at, df)
    type - 1 for buff, -1 for debuff, 0 for no change
    column - "symbol", "landForm" or "map"
*/
export const getStatModMap = (ae, attribute, monsterAttribute, base, type = 1, column) => {
    if (!attribute) { return 0; }
    const attributeStrength = attribute.strength;
    const attributeName = attribute.attribute;
    if (type === 0 || attributeStrength === 0 || !attributeName) { return 0; } // no stat change

    let mod = getAttributeModifier(attributeName, monsterAttribute, column);

    // check discrepancies

    // Dark monsters on Wood land form ae
    if (attributeName === "Wood" && monsterAttribute === "Dark" && column === "landForm") {
        // i dont know the exact relation, but this is close enough for now
        if (ae + attributeStrength <= 140) {
            return 0;
        }
    }

    // Fire monsters on Wind map ae
    if (attributeName === "Wind" && monsterAttribute === "Fire" && column === "map") {
        if (attributeStrength < 20) { return 0; }
        if (attributeStrength < 50) {
            mod = 2;
        } else if (ae < 120) {
            // any fire monster except fire reaper
            // since fire reaper is the only monster to have a
            // map ae of 120+
            mod = 10;
            type = -1;
        } else {
            // only fire reaper has a 120+ map ae
            // probably some formula that works on all fire monsters
            // but this lazy method is ok for now
            mod = 6;
            type = -1;
        }
    }

    // Earth monsters on Dark map ae
    if (attributeName === "Dark" && monsterAttribute === "Earth" && column === "map") {
        if (attributeStrength < 20 || attributeStrength >= 50) { return 0; }
    }

    let percent = ae / 100;
    percent *= attributeStrength;
    percent /= 100;
    percent *= base;
    percent /= mod;
    return percent * type;
};

// returns { pp, at, df } where each value is either -1 for a decrease, 0 for no change, or 1 for a boost
export const getStatChangesFromAttributes = (source, effectAttribute, monsterAttributeName, ae) => {
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

    // check discrepancies

    // Dark monsters on Wood land form ae
    if (effectAttributeName === "Wood" && monsterAttributeName === "Dark" && source === "land") {
        if (ae + strength <= 140) {
            statChanges = {
                ...statChanges,
                df: 0
            };
        }
    }

    // Fire monsters on Wind map ae
    if (effectAttributeName === "Wind" && monsterAttributeName === "Fire" && source === "map") {
        if (strength < 20) {
            statChanges = {
                ...statChanges,
                at: 0
            };
        } else if (strength < 50) { // this check is redundant
            statChanges = {
                ...statChanges,
                at: 1
            };
        } else {
            statChanges = {
                ...statChanges,
                at: -1
            };
        }
    }

    // Earth monsters on Dark map ae
    if (effectAttributeName === "Dark" && monsterAttributeName === "Earth" && source === "map") {
        if (strength < 20 || strength >= 50) {
            statChanges = {
                ...statChanges,
                at: 0
            };
        }
    }

    return statChanges;
};

// returns modifier to use in percentage-based stat calculation
// should never realistically be undefined
const getAttributeModifier = (effectAttributeName, monsterAttributeName, effectType) => {
    return ATTRIBUTE_BOOSTS[monsterAttributeName][effectType][effectAttributeName] || 1;
};

export const generateGridFromAttributes = (monsterAttribute, attributes, aeArray) => {
    const grid = Array(24).fill(0);

    const [symbolAE, landFormAE, mapAE] = aeArray || [0, 0, 0];

    const ez = {
        symbol: getStatChangesFromAttributes('symbol', attributes.symbol, monsterAttribute, symbolAE),
        landForm: attributes.landForm.map(x => getStatChangesFromAttributes('land', x, monsterAttribute, landFormAE)),
        map: attributes.map.map(x => getStatChangesFromAttributes('map', x, monsterAttribute, mapAE))
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

export const isPair = (attribute1, attribute2) => {
    const A = ["Earth", "Water", "Fire", "Wind", "Light", "Dark", "Wood", "Thunder"];
    const B = ["Thunder", "Fire", "Wood", "Water", "Dark", "Earth", "Wind", "Light"];

    return A.indexOf(attribute1) === B.indexOf(attribute2) || A.indexOf(attribute2) === B.indexOf(attribute1);
};
