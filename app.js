// Global State
let currentBoard = [];
let currentEmblems = {}; // { RegionName: Count }

// Error Handler for Syntax/Runtime errors
window.onerror = function (msg, url, lineNo, columnNo, error) {
    alert(`오류 발생: ${msg}\n라인: ${lineNo}`);
    return false;
};

document.addEventListener('DOMContentLoaded', () => {
    try {
        if (typeof CHAMPIONS === 'undefined') {
            throw new Error("데이터 파일(data.js)이 로드되지 않았습니다.");
        }

        populateTraitFilter();
        renderChampionList();
        setupEventListeners();
        updateBoardUI();
    } catch (e) {
        alert("초기화 중 오류 발생: " + e.message);
        console.error(e);
    }
});

function populateTraitFilter() {
    const select = document.getElementById('trait-filter');
    const emblemSelect = document.getElementById('emblem-select');

    // Sort regions first, then others
    const allTraits = Object.keys(TRAIT_RULES).sort();

    if (select) {
        allTraits.forEach(trait => {
            const option = document.createElement('option');
            option.value = trait;
            option.textContent = trait + (REGIONS.includes(trait) ? " (지역)" : "");
            select.appendChild(option);
        });
    }

    if (emblemSelect) {
        // Populate Emblem Select (Only Regions)
        REGIONS.sort().forEach(region => {
            const option = document.createElement('option');
            option.value = region;
            option.textContent = region;
            emblemSelect.appendChild(option);
        });
    }
}

function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    const traitFilter = document.getElementById('trait-filter');

    if (searchInput) {
        searchInput.addEventListener('input', refreshChampionListState);
    }

    if (traitFilter) {
        traitFilter.addEventListener('change', refreshChampionListState);
    }

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            refreshChampionListState();
        });
    });

    const levelInput = document.getElementById('level-input');
    if (levelInput) {
        levelInput.addEventListener('change', updateBoardUI);
    }

    const solveBtn = document.getElementById('solve-btn');
    if (solveBtn) {
        solveBtn.addEventListener('click', generateSolutions);
    }

    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            currentBoard = [];
            currentEmblems = {}; // Clear emblems too
            updateBoardUI();
            refreshChampionListState();
        });
    }

    // Emblem Add Button
    const addEmblemBtn = document.getElementById('add-emblem-btn');
    if (addEmblemBtn) {
        addEmblemBtn.addEventListener('click', () => {
            const select = document.getElementById('emblem-select');
            const region = select.value;
            if (region) {
                currentEmblems[region] = (currentEmblems[region] || 0) + 1;
                updateBoardUI(); // Update UI to show badge
                select.value = ""; // Reset select
            }
        });
    }
}

// Wrapper to get current filter values and render
function refreshChampionListState() {
    const searchVal = document.getElementById('search-input')?.value || '';
    const costVal = document.querySelector('.filter-btn.active')?.dataset.cost || 'all';
    const traitVal = document.getElementById('trait-filter')?.value || 'all';

    renderChampionList(searchVal, costVal, traitVal);
}

function renderChampionList(filterName = '', filterCost = 'all', filterTrait = 'all') {
    const grid = document.getElementById('champion-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const filtered = CHAMPIONS.filter(c => {
        const matchesName = c.name.toLowerCase().includes(filterName.toLowerCase());
        const matchesCost = filterCost === 'all' || c.cost.toString() === filterCost;
        const matchesTrait = filterTrait === 'all' || c.traits.includes(filterTrait);
        return matchesName && matchesCost && matchesTrait;
    });

    const currentNames = new Set(currentBoard.map(c => c.name));

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="color:#666; width:100%; text-align:center;">조건에 맞는 챔피언이 없습니다.</p>';
        return;
    }

    filtered.forEach(champ => {
        const card = document.createElement('div');
        card.className = `champ-card cost-${champ.cost}`;

        // Disable if already on board
        const isDisabled = currentNames.has(champ.name);
        if (isDisabled) {
            card.classList.add('disabled');
            card.title = "이미 보드에 있습니다";
        }

        // Fix: Ensure traits provided to avoid join error
        const traitsStr = champ.traits ? champ.traits.join(', ') : '';

        card.innerHTML = `
            <span class="name">${champ.name}</span>
            <div class="traits">${traitsStr}</div>
        `;

        if (!isDisabled) {
            card.addEventListener('click', () => addToBoard(champ));
        }

        grid.appendChild(card);
    });
}

function addToBoard(champ) {
    const logicLimit = parseInt(document.getElementById('level-input')?.value || 9);
    // Hard cap at 10 for UI grid
    if (currentBoard.length >= 10) {
        alert("보드가 가득 찼습니다 (최대 10명 UI 제한)");
        return;
    }

    // Prevent duplicates (double safely)
    if (currentBoard.some(c => c.name === champ.name)) return;

    currentBoard.push(champ);
    updateBoardUI();
    refreshChampionListState();
}

function removeFromBoard(index) {
    currentBoard.splice(index, 1);
    updateBoardUI();
    refreshChampionListState();
}

function updateBoardUI() {
    // Update count display
    const countEl = document.getElementById('board-count');
    if (countEl) countEl.textContent = currentBoard.length;

    // Render Board Grid
    const boardGrid = document.getElementById('my-board');
    if (!boardGrid) return;

    boardGrid.innerHTML = '';
    const logicLimit = parseInt(document.getElementById('level-input')?.value || 9);

    for (let i = 0; i < 10; i++) {
        const slot = document.createElement('div');
        slot.className = 'board-slot';

        if (i < currentBoard.length) {
            const champ = currentBoard[i];
            slot.classList.add('filled');
            slot.style.borderLeft = `3px solid var(--rarity-${champ.cost})`;

            slot.innerHTML = `
                <div class="champ-content">
                    <span class="name">${champ.name}</span>
                </div>
            `;
            slot.title = "클릭하여 제거";
            slot.onclick = () => removeFromBoard(i);
        } else {
            // Empty slot visual logic
            if (i >= logicLimit) {
                // Slots beyond current level
                slot.style.background = '#0d0d0d';
                slot.style.border = '1px solid #222';
            } else {
                slot.innerHTML = '<span style="color:#333; font-size:1.5rem;">+</span>';
            }
        }
        boardGrid.appendChild(slot);
    }

    // Update Active Traits
    const traitList = document.getElementById('trait-list');
    if (traitList && typeof getActiveRegionsDetails === 'function') {
        traitList.innerHTML = '';
        const details = getActiveRegionsDetails(currentBoard, currentEmblems);

        let activeRegionCount = 0;

        details.forEach(d => {
            if (d.active) activeRegionCount++;
            const item = document.createElement('div');
            item.className = `trait-item ${d.active ? 'active' : ''}`;
            item.innerHTML = `
                <span>${d.name}</span>
                <span>${d.count} / ${d.required}</span>
            `;
            traitList.appendChild(item);
        });

        const activeCountEl = document.getElementById('active-region-count');
        if (activeCountEl) {
            activeCountEl.textContent = activeRegionCount;
            activeCountEl.style.color = activeRegionCount >= 4 ? 'var(--accent-blue)' : '';
        }
    }

    // Update Emblem List UI
    const emblemList = document.getElementById('emblem-list');
    if (emblemList) {
        emblemList.innerHTML = '';
        const traits = Object.keys(currentEmblems);
        if (traits.length === 0) {
            emblemList.innerHTML = '<span style="color: #555; font-size: 0.8rem; padding: 3px;">없음</span>';
        } else {
            traits.forEach(trait => {
                const count = currentEmblems[trait];
                if (count > 0) {
                    const badge = document.createElement('div');
                    badge.style.cssText = 'background: #333; border: 1px solid #555; border-radius: 4px; padding: 2px 6px; font-size: 0.8rem; color: #eee; display: flex; align-items: center; gap: 5px;';
                    badge.innerHTML = `
                        <span>${trait} x${count}</span>
                        <span class="remove-emblem" style="cursor: pointer; color: #ff5555; font-weight: bold;">&times;</span>
                    `;
                    badge.querySelector('.remove-emblem').addEventListener('click', () => {
                        currentEmblems[trait]--;
                        if (currentEmblems[trait] <= 0) delete currentEmblems[trait];
                        updateBoardUI();
                    });
                    emblemList.appendChild(badge);
                }
            });
        }
    }
}

function generateSolutions() {
    const container = document.getElementById('solutions-container');
    const maxLevel = parseInt(document.getElementById('level-input')?.value || 9);
    container.innerHTML = '계산 중...';

    setTimeout(() => {
        try {
            if (typeof findSolutions !== 'function') {
                throw new Error("로직 파일(script.js)이 로드되지 않았습니다.");
            }
            const solutions = findSolutions(currentBoard, maxLevel, currentEmblems);
            renderSolutions(solutions);
        } catch (e) {
            container.innerHTML = "오류 발생: " + e.message;
        }
    }, 50);
}

function renderSolutions(solutions) {
    const container = document.getElementById('solutions-container');
    container.innerHTML = '';

    if (!solutions || solutions.length === 0) {
        container.innerHTML = '<p class="placeholder-text">가능한 해답을 찾지 못했습니다.<br>보드를 비우거나 기본 유닛 수를 줄여보세요.</p>';
        return;
    }

    solutions.forEach(sol => {
        const card = document.createElement('div');
        card.className = 'solution-card';

        let title = sol.type === 'add'
            ? `추가 (+${sol.added.length} 유닛)`
            : `교체 (-${sol.removed.length}, +${sol.added.length})`;

        let content = '';

        if (sol.removed.length > 0) {
            content += `<div class="solution-details"><strong>제거:</strong> <span class="removed-unit">${sol.removed.map(u => u.name).join(', ')}</span></div>`;
        }

        content += `<div class="solution-details"><strong>추가:</strong> <span class="added-unit">${sol.added.map(u => u.name).join(', ')}</span></div>`;
        content += `<div class="solution-details" style="font-size:0.8rem; margin-top:5px; color:#888;">비용: ${sol.cost} 골드</div>`;

        // Active regions
        const activeDetails = getActiveRegionsDetails(sol.finalTeam, currentEmblems);
        const regionNames = activeDetails.filter(r => r.active).map(r => r.name);

        // Other active traits
        const allActiveTraits = calculateActiveTraits(sol.finalTeam, currentEmblems).active;
        const otherTraits = Object.keys(allActiveTraits).filter(t => !REGIONS.includes(t));

        content += `<div class="solution-details" style="font-size:0.8rem; color:var(--accent-blue); margin-top:2px;"><strong>활성 지역:</strong> ${regionNames.join(', ')}</div>`;

        if (otherTraits.length > 0) {
            content += `<div class="solution-details" style="font-size:0.8rem; color:#aaa; margin-top:2px;"><strong>기타 시너지:</strong> ${otherTraits.join(', ')}</div>`;
        }

        // Apply Button
        content += `<div style="margin-top:10px; text-align:right;"><button class="apply-btn" style="background:var(--accent-gold); border:none; border-radius:4px; cursor:pointer; font-weight:bold; padding:4px 8px; color:#121212;">적용하기</button></div>`;

        card.innerHTML = `<h3>${title}</h3>${content}`;

        card.querySelector('.apply-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            applySolution(sol);
        });

        container.appendChild(card);
    });
}

function applySolution(solution) {
    if (confirm("현재 보드를 이 조합으로 변경하시겠습니까?")) {
        currentBoard = [...solution.finalTeam];
        updateBoardUI();
        refreshChampionListState();
        window.scrollTo(0, 0);
    }
}
