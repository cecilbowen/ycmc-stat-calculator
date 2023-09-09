# Yu-Gi-Oh! Capsule Monster Coliseum Stat Calculator

This tool lets you input a monster's base stats and calculates what the expected stats should be based on the current attributes affecting the monster.  Visually, the tool is similar to the "Capabilities" screen in-game.

## Stat Validator (Testing)

![Validator compact screenshot](https://i.imgur.com/KjfkkfK.png)
Since finding the accurate formula for calculating stats is a work-in-progress, this tool includes a monster stat validator with a suite of test set data built-in. The validator also lets add your own test data.  All saved test sets, both original and custom, are then run through the current stat calculation formula to see if they pass or fail.  This is visually indicated by a row of 3 emojis under each test set, respectively standing for whether PP (health), AT (attack) and DF (defense) each passed or failed.

> Wind Monster Test Set\
> (PP, AT, DF): (no change, pass, perfect pass)\
![Example test set row](https://i.imgur.com/PA8oLbg.png)
- ✅ - Calculated stat matches expected stat exactly (perfect pass)
- ☑️ - Calculated stat is within 3 (leniency) of expected stat (pass)
- ❌ - Calculated stat does not match nor fall within 3 (leniency) of expected stat (fail)
- ➖ - Calculated stat did not change from the initial stat

In layman's terms, what the validator does is the equivalent of checking your monster's stats in-game to see if the calculator is correct.

## Stat Calculation Breakdown

![Compact screenshot](https://i.imgur.com/EGcYnlK.png)
If you just want to know where the stat calculation happens, you can find it [in the calculateStats() function from `utils.js`](https://github.com/cecilbowen/ycmc-stat-calculator/blob/58e0aab88498a13eb687f2476d13192f7cc6de9c/src/utils.js#L32).

Here are the general steps to calculate one of the three stats:
1. percent = (**AE** / 100) * **attribute strength**
2. portion = (percent / 100) * **base stat**
3. stat change = **base stat** + (portion / **mod**) * **arrow**

> **AE** stands for either the *Symbol %*, *Land %* or *Map %* value\
> **attribute strength** stands for the value underneath each active (up/down arrow) attribute\
> **base stat** stands for either the base *PP*, *AT* or *DF*\
> **mod** stands for a lookup value from [`attributeBoosts.json`](https://github.com/cecilbowen/ycmc-stat-calculator/blob/58e0aab88498a13eb687f2476d13192f7cc6de9c/src/data/attributeBoosts.json)\
> **arrow** stands for *1* if it's a stat increase, *-1* if it's a decrease or *0* if there is no change

This will give you the stat change for each active attribute.  You can then sum these changes with their respective base stats to get the calculated result.

The **mod** value above is really the variable part of the formula.  It's a value dependent on both the monster's attribute and the attribute/strength of the effect attribute.  As an example, in the image above, DF only has one stat change -- a decrease caused by a Map Wind attribute of 20.  The tool knows it's a decrease, because it checks the corresponding AE (in this case *map*) attribute matchup file, [`attributeMatchups_map_effect-monster.json`](https://github.com/cecilbowen/ycmc-stat-calculator/blob/58e0aab88498a13eb687f2476d13192f7cc6de9c/src/data/attributeMatchups_map_effect-monster.json) like `matchup["Wind"]["Water"]` to get `AT DF -` (an AT and DF decrease).  So knowing this, you would check [`attributeBoosts.json`](https://github.com/cecilbowen/ycmc-stat-calculator/blob/58e0aab88498a13eb687f2476d13192f7cc6de9c/src/data/attributeBoosts.json) like so: `attributeBoosts["Water"]["map"]["Wind"]`.  This would give you a **mod** value of 2.65.

## Improvements and Contributions

The calculations mostly work, but there are some [discrepancies](https://github.com/cecilbowen/ycmc-stat-calculator/blob/58e0aab88498a13eb687f2476d13192f7cc6de9c/discrepancies.txt) I've found that are also handled in the stat calculation.  These discrepancies are the weakness of the tool, as the exceptions that are made to handle them seem too conditional.  For example, Fire Reaper is one such discrepancy when calculating a Map Wind attribute stat change.  This is probably because it's the only Fire attribute monster with a map AE as high as 120% (that I know of).  Pair this with the fact that past 50+ Wind Map attribute strength, all Fire monsters swap from being buffed by Wind Map attributes to being nerfed\*, and you likely have some funky relation between the Map AE and the attribute strength that I'm not accounting for.  **There probably exists a better formula that handles both discrepancies and regular calculations, and you are free to contribute to discovering it if you want**.

>\* *If you're interested in this specific discrepancy, you can see it by comparing the effects of the Wind Map attribute on Fire monsters in Odion's map (30 strength) versus the effects in Ishizu-1's (Ishizu's first encounter) map (50 strength).*

I've also attempted to manipulate the AE's and attribute strengths of monsters via Cheat Engine on PCSX2, but my level of skill in finding dynamic pointers and such must not be sufficient enough, because I cannot, for the life of me, successfully change any of the mentioned values.  Therefore, I've stuck to using save states and in-game isolation techniques.  Here's a few:
- **Marik's map (Guru's Garden)**: there is no active Map Attribute and you can easily choose a specific Land Form attribute to land on
- **Monster abilities**: abilities like *Place of Wood*, which increases the Wood Land Form attribute strength, *Sparkle of Wood* which removes the Symbol attribute strength all-together or *Place of Wind* which increases the Wind Map attribute strength
- **Deployment**: checking a monster's stats from the deployment screen will only have the Map attributes affect the monster, effectively isolating only the Map attribute stat changes

## Miscellaneous Notes

Light, Dark and Wind are the most commonly used map attributes across the whole game.  It's kind of a shame, since attributes like Water, Earth, Wood and Thunder only get used as Map attributes once each respectively in the Pegasus-2, Odion, Tristan and Mokuba maps (excluding Shadi-2's map, since the dragon event adds them dynamically).  You can see the attributes/strengths used in every stage in [`stageMapAttributes.json`](https://github.com/cecilbowen/ycmc-stat-calculator/blob/58e0aab88498a13eb687f2476d13192f7cc6de9c/src/data/stageMapAttributes.json).
