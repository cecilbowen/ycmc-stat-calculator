/*
Meaning symbol has at max 1 attribute, land has a max of 3 attributes (per space),
and the map has at max 4 attributes (pegasus-2 is the only one with 4)
*/
export const MAX = {
    SYMBOL: 1, LAND: 3, MAP: 4
};

export const ATTRIBUTES = {
    symbol: {
        attribute: "Light",
        strength: 20
    },
    landForm: [
        {
            attribute: "Earth",
            strength: 5
        },
        {
            attribute: "Wood",
            strength: 5
        }
    ],
    map: [
        {
            attribute: "Light",
            strength: 16
        },
        {
            attribute: "Dark",
            strength: 5
        },
        {
            attribute: "Wind",
            strength: 5
        },
    ]
};
