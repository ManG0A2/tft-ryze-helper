// script.js

// Global state for current user board
// Global state for current user board - REMOVED to avoid conflict with app.js
// let currentBoard = [];

/**
 * Calculates active traits for a given list of champions + emblems.
 * @param {Array} units - Array of champion objects
 * @param {Object} emblems - Map of { TraitName: Count } (optional)
 * @returns {Object} Map of trait names to active levels
 */
function calculateActiveTraits(units, emblems = {}) {
    const traitCounts = {};
    const uniqueUnits = new Set(); // Traits don't stack for duplicate units

    units.forEach(unit => {
        if (!uniqueUnits.has(unit.name)) {
            uniqueUnits.add(unit.name);
            unit.traits.forEach(trait => {
                traitCounts[trait] = (traitCounts[trait] || 0) + 1;
            });
        }
    });

    // Add Emblems
    for (const [trait, count] of Object.entries(emblems)) {
        if (typeof count === 'number' && count > 0) {
            traitCounts[trait] = (traitCounts[trait] || 0) + count;
        }
    }

    const activeTraits = {};
    for (const [trait, count] of Object.entries(traitCounts)) {
        if (TRAIT_RULES[trait] && count >= TRAIT_RULES[trait]) {
            activeTraits[trait] = count;
        }
    }

    return { counts: traitCounts, active: activeTraits };
}

/**
 * Checks if the list has at least 4 ACTIVE REGION traits (considering emblems).
 */
function hasFourActiveRegions(units, emblems = {}) {
    const { active } = calculateActiveTraits(units, emblems);
    let regionCount = 0;
    for (const trait of Object.keys(active)) {
        if (REGIONS.includes(trait)) {
            regionCount++;
        }
    }
    return regionCount >= 4;
}

// Find solutions to unlock Ryze (4 regions).
function findSolutions(baseUnits, maxLevel = 9, emblems = {}) {
    const solutions = [];
    const baseNames = new Set(baseUnits.map(u => u.name));

    // Optimization: Filter champions that provide regions
    const relevantChamps = CHAMPIONS.filter(c =>
        c.traits.some(t => REGIONS.includes(t)) && !baseNames.has(c.name)
    );

    // Identify if Ryze is needed
    // Ryze doesn't provide a region, but he is the goal.
    const ryzeUnit = CHAMPIONS.find(c => c.name === "라이즈");
    const needsRyze = !baseNames.has("라이즈");

    // Mandatory units to add (Ryze if missing)
    const mandatoryAdd = needsRyze && ryzeUnit ? [ryzeUnit] : [];

    // 1. Try Adding Units
    // Effective slots available for *other* units
    // Total slots: maxLevel
    // Used by base: baseUnits.length
    // Used by mandatory: mandatoryAdd.length
    const currentCount = baseUnits.length + mandatoryAdd.length;
    const slotsAvailable = maxLevel - currentCount;

    if (slotsAvailable >= 0) {
        // Even if 0 slots available for *extra* units, we still test the base+mandatory team
        // Try combinations of size 0 to slotsAvailable (limited to 4 for performance)
        const scanDepth = Math.min(slotsAvailable, 4);

        for (let size = 0; size <= scanDepth; size++) {
            const combinations = getCombinations(relevantChamps, size);

            for (const combo of combinations) {
                // Team = Base + Mandatory (Ryze) + Synergy Units (Combo)
                const addedUnits = [...mandatoryAdd, ...combo];
                const testTeam = [...baseUnits, ...addedUnits];

                if (hasFourActiveRegions(testTeam, emblems)) {
                    solutions.push({
                        type: 'add',
                        added: addedUnits,
                        removed: [],
                        finalTeam: testTeam,
                        cost: addedUnits.reduce((sum, c) => sum + c.cost, 0),
                        actionCount: addedUnits.length
                    });
                }
            }
            if (solutions.length > 20) break;
        }
    }

    // 2. Try Swapping
    if (solutions.length < 5 && baseUnits.length > 0) {
        for (let i = 0; i < baseUnits.length; i++) {
            const unitToRemove = baseUnits[i];
            const remainingBase = baseUnits.filter((_, idx) => idx !== i);

            // Re-calculate needs for this scenario
            // If we removed Ryze (unlikely but logic holds), we need him back.
            // If we removed someone else, we still need Ryze if we needed him before.
            const stillNeedsRyze = !remainingBase.some(u => u.name === "라이즈");
            const swapMandatory = stillNeedsRyze && ryzeUnit ? [ryzeUnit] : [];

            const swapCurrentCount = remainingBase.length + swapMandatory.length;
            const currentSlots = maxLevel - swapCurrentCount;

            if (currentSlots >= 0) {
                // Try adding up to limited depth
                for (let size = 0; size <= Math.min(currentSlots, 3); size++) {
                    const combinations = getCombinations(relevantChamps, size);
                    for (const combo of combinations) {
                        const addedUnits = [...swapMandatory, ...combo];
                        const testTeam = [...remainingBase, ...addedUnits];

                        if (hasFourActiveRegions(testTeam, emblems)) {
                            // Don't suggest swapping if we just added back the same unit we removed (and Ryze wasn't the issue)
                            // But usually unique filter handles clutter.

                            solutions.push({
                                type: 'swap',
                                added: addedUnits,
                                removed: [unitToRemove],
                                finalTeam: testTeam,
                                cost: addedUnits.reduce((sum, c) => sum + c.cost, 0),
                                actionCount: addedUnits.length + 1
                            });
                        }
                    }
                    if (solutions.length > 30) break;
                }
            }
        }
    }

    // Sort solutions
    // 1. Fewer actions (changes)
    // 2. Lower cost
    // 3. [New] More total active traits
    solutions.sort((a, b) => {
        if (a.actionCount !== b.actionCount) return a.actionCount - b.actionCount;
        if (a.cost !== b.cost) return a.cost - b.cost;

        // Calculate total active traits for tie-breaking
        const activeA = Object.keys(calculateActiveTraits(a.finalTeam, emblems).active).length;
        const activeB = Object.keys(calculateActiveTraits(b.finalTeam, emblems).active).length;
        return activeB - activeA; // Higher is better
    });

    // Unique filter
    const uniqueSolutions = [];
    const seen = new Set();
    for (const sol of solutions) {
        const key = sol.added.map(u => u.name).sort().join(',') + '|' + sol.removed.map(u => u.name).sort().join(',');
        if (!seen.has(key)) {
            seen.add(key);
            uniqueSolutions.push(sol);
        }
    }

    return uniqueSolutions.slice(0, 10); // Return top 10
}

function getCombinations(array, size) {
    const result = [];
    function backtrack(start, current) {
        if (current.length === size) {
            result.push([...current]);
            return;
        }
        for (let i = start; i < array.length; i++) {
            backtrack(i + 1, [...current, array[i]]);
        }
    }
    backtrack(0, []);
    return result;
}

// UI helper: Get active regions details
function getActiveRegionsDetails(units, emblems = {}) {
    const { counts, active } = calculateActiveTraits(units, emblems);
    const details = [];

    REGIONS.forEach(region => {
        const count = counts[region] || 0;
        const isActive = active[region] !== undefined;
        const required = TRAIT_RULES[region];
        if (count > 0) {
            details.push({
                name: region,
                count: count,
                required: required,
                active: isActive
            });
        }
    });

    // Sort active first
    details.sort((a, b) => (b.active === a.active ? 0 : b.active ? 1 : -1));
    return details;
}
