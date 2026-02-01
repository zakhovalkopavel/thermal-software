/**
 * Blend Optimizer UI Controller
 *
 * Handles user interactions for the blend optimizer interface
 * Integrates with BlendOptimizer, MixLibraryService, and MaterialLibrary
 */

import { BlendOptimizer } from '../../dist/calculators/BlendOptimizer.js';
import { MixLibraryService } from '../../dist/services/MixLibraryService.js';
import { MaterialLibrary } from '../../dist/data/MaterialLibrary.js';

// Global state
let fractionCounter = 0;
let currentResults = [];
let selectedResultIndex = -1;
let selectedLibraryMixId = null;

const materialLibrary = MaterialLibrary.getInstance();
const mixLibrary = MixLibraryService.getInstance();
const blendOptimizer = new BlendOptimizer();

/**
 * Initialize the page
 */
window.addEventListener('DOMContentLoaded', () => {
    console.log('Blend Optimizer initialized');

    // Add initial fraction
    addFraction();

    // Load material options
    loadMaterialOptions();

    // Setup event listeners
    setupEventListeners();
});

/**
 * Load available materials into dropdowns
 */
function loadMaterialOptions() {
    const materials = materialLibrary.getAllMaterials();

    // Store for use in fraction rows
    window.availableMaterials = materials;
}

/**
 * Setup global event listeners
 */
function setupEventListeners() {
    // Search in library browser
    const searchInput = document.getElementById('library-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterLibrary(e.target.value);
        });
    }
}

/**
 * Add a new fraction row
 */
window.addFraction = function() {
    fractionCounter++;
    const container = document.getElementById('fraction-container');

    const row = document.createElement('div');
    row.className = 'fraction-row';
    row.id = `fraction-${fractionCounter}`;

    // Build material options
    const materials = window.availableMaterials || [];
    const materialOptions = materials.map(m =>
        `<option value="${m.materialId}">${m.name}</option>`
    ).join('');

    row.innerHTML = `
        <div>${fractionCounter}</div>
        <div><input type="number" class="dmin-input" value="1.0" step="0.1" min="0.001"></div>
        <div><input type="number" class="dmax-input" value="3.0" step="0.1" min="0.001"></div>
        <div>
            <select class="material-select">
                <option value="">-- Select --</option>
                ${materialOptions}
            </select>
        </div>
        <div style="text-align: center;">
            <input type="checkbox" class="fixed-checkbox" onchange="toggleFixedAmount(${fractionCounter})" 
                   title="Check to fix this fraction at a specific percentage">
        </div>
        <div>
            <input type="number" class="amount-input" value="25" min="0" max="100" step="0.1" 
                   oninput="updateFixedTotal()">
        </div>
        <div>
            <button class="btn btn-small btn-danger" onclick="removeFraction(${fractionCounter})">
                Remove
            </button>
        </div>
    `;

    container.appendChild(row);
    updateFixedTotal();
};

/**
 * Toggle fixed amount input visibility and behavior
 */
window.toggleFixedAmount = function(fractionId) {
    const row = document.getElementById(`fraction-${fractionId}`);
    if (!row) return;

    const checkbox = row.querySelector('.fixed-checkbox');
    const amountInput = row.querySelector('.amount-input');

    if (checkbox.checked) {
        // When fixed, highlight the amount field
        amountInput.style.backgroundColor = '#fff3cd';
        amountInput.style.fontWeight = 'bold';
        amountInput.title = 'Fixed amount - will not be optimized';
    } else {
        // When variable, normal appearance
        amountInput.style.backgroundColor = '';
        amountInput.style.fontWeight = '';
        amountInput.title = 'Will be optimized by PSD model';
    }

    updateFixedTotal();
};

/**
 * Update the fixed total display
 */
window.updateFixedTotal = function() {
    const container = document.getElementById('fraction-container');
    const rows = container.querySelectorAll('.fraction-row');

    let totalFixed = 0;
    let fixedCount = 0;

    for (const row of rows) {
        const checkbox = row.querySelector('.fixed-checkbox');
        const amountInput = row.querySelector('.amount-input');

        if (checkbox && checkbox.checked && amountInput) {
            const amount = parseFloat(amountInput.value) || 0;
            totalFixed += amount;
            fixedCount++;
        }
    }

    const display = document.getElementById('fixed-total-display');
    if (display) {
        if (fixedCount > 0) {
            const variablePercent = 100 - totalFixed;
            const color = totalFixed >= 100 ? 'red' : (totalFixed > 90 ? 'orange' : 'var(--primary-color)');
            display.innerHTML = `
                Fixed: <span style="color: ${color}">${totalFixed.toFixed(1)}%</span> | 
                Variable: ${variablePercent.toFixed(1)}%
            `;
        } else {
            display.innerHTML = '';
        }
    }
};

/**
 * Remove a fraction row
 */
window.removeFraction = function(id) {
    const row = document.getElementById(`fraction-${id}`);
    if (row) {
        row.remove();
        updateFixedTotal();
    }
};

/**
 * Clear all fractions
 */
window.clearFractions = function() {
    if (confirm('Clear all fractions?')) {
        document.getElementById('fraction-container').innerHTML = '';
        fractionCounter = 0;
        addFraction();
        updateFixedTotal();
    }
};

/**
 * Collect fraction inputs from UI
 */
function collectFractionInputs() {
    const container = document.getElementById('fraction-container');
    const rows = container.querySelectorAll('.fraction-row');
    const fractions = [];

    let totalFixed = 0;

    for (const row of rows) {
        const dMin = parseFloat(row.querySelector('.dmin-input').value);
        const dMax = parseFloat(row.querySelector('.dmax-input').value);
        const materialId = row.querySelector('.material-select').value;
        const checkbox = row.querySelector('.fixed-checkbox');
        const amountInput = row.querySelector('.amount-input');

        if (!materialId) {
            throw new Error('Please select a material for all fractions');
        }

        if (dMin >= dMax) {
            throw new Error(`Invalid size range: dMin (${dMin}) must be < dMax (${dMax})`);
        }

        const isFixed = checkbox ? checkbox.checked : false;
        const amount = parseFloat(amountInput.value) || 0;

        if (isFixed) {
            if (amount <= 0 || amount >= 100) {
                throw new Error(`Fixed amount must be between 0 and 100% (got ${amount}%)`);
            }
            totalFixed += amount;
        }

        fractions.push({
            id: row.id,
            dMin_mm: dMin,
            dMax_mm: dMax,
            materialId: materialId,
            isFixed: isFixed,
            fixedAmount: isFixed ? amount : undefined
        });
    }

    // Validate total fixed amount
    if (totalFixed >= 100) {
        throw new Error(`Total fixed fractions (${totalFixed.toFixed(1)}%) must be less than 100%`);
    }

    // Ensure at least one variable fraction
    const variableCount = fractions.filter(f => !f.isFixed).length;
    if (variableCount === 0) {
        throw new Error('At least one variable (non-fixed) fraction is required for optimization');
    }

    return fractions;
}


/**
 * Collect optimization options from UI
 */
function collectOptimizationOptions() {
    // Methods
    const methods = [];
    if (document.getElementById('method-andreasen').checked) methods.push('Andreasen');
    if (document.getElementById('method-funkdinger').checked) methods.push('FunkDinger');

    // q values
    const qText = document.getElementById('q-values').value;
    const qValues = qText.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));

    // Packing models
    const packingModelSelect = document.getElementById('packing-model').value;
    let packingModels = [];
    if (packingModelSelect === 'both') {
        packingModels = ['CPM', 'Furnas'];
    } else {
        packingModels = [packingModelSelect];
    }

    // Scenarios
    const scenarios = [];
    if (document.getElementById('scenario-self').checked) scenarios.push('Self-compacting');
    if (document.getElementById('scenario-flowable').checked) scenarios.push('Flowable');
    if (document.getElementById('scenario-vibrated').checked) scenarios.push('Vibratable');
    if (document.getElementById('scenario-handpress').checked) scenarios.push('Hand-pressable');

    // Temperature profile
    const tempText = document.getElementById('temp-profile').value;
    const temperatureProfile_C = tempText.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));

    return {
        methods,
        qValues,
        packingModels,
        scenarios,
        temperatureProfile_C
    };
}

/**
 * Optimize blend - main calculation
 */
window.optimizeBlend = async function() {
    try {
        // Collect inputs
        const fractions = collectFractionInputs();
        const options = collectOptimizationOptions();

        // Validate
        if (fractions.length === 0) {
            alert('Please add at least one fraction');
            return;
        }

        if (options.methods.length === 0) {
            alert('Please select at least one PSD method');
            return;
        }

        if (options.scenarios.length === 0) {
            alert('Please select at least one scenario');
            return;
        }

        // Show loading
        const resultsSection = document.getElementById('results-section');
        const resultsContainer = document.getElementById('results-container');
        resultsSection.style.display = 'block';
        resultsContainer.innerHTML = '<p>⏳ Calculating optimal blends...</p>';

        // Run optimization
        const results = blendOptimizer.optimize(fractions, options);

        // Store results
        currentResults = results;

        // Display results
        displayResults(results);

    } catch (error) {
        alert('Error: ' + error.message);
        console.error(error);
    }
};

/**
 * Display optimization results
 */
function displayResults(results) {
    const container = document.getElementById('results-container');

    if (results.length === 0) {
        container.innerHTML = '<p>No results generated.</p>';
        return;
    }

    let html = '<div style="margin-bottom: 20px;">';
    html += `<p><strong>Generated ${results.length} blend variant(s)</strong></p>`;
    html += '</div>';

    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        html += createResultCard(result, i);
    }

    container.innerHTML = html;
}

/**
 * Create a result card HTML
 */
function createResultCard(result, index) {
    const temps = Object.keys(result.rhoBulk_gml_byTemp || {});
    const maxTemp = temps.length > 0 ? temps[temps.length - 1] : 'N/A';

    let html = `
        <div class="results-card" id="result-${index}">
            <h3>
                ${result.method} | q=${result.q} | ${result.scenario}
                <span style="float: right; font-size: 14px; color: #666;">
                    Packing: ${(result.packingEfficiency * 100).toFixed(1)}%
                </span>
            </h3>
            
            <div class="property-grid">
                <div class="property-item">
                    <span>Skeletal Density:</span>
                    <strong>${result.rhoSkeletal_gml.toFixed(2)} g/ml</strong>
                </div>
                <div class="property-item">
                    <span>Bulk Density (green):</span>
                    <strong>${result.rhoBulk_gml_green.toFixed(2)} g/ml</strong>
                </div>
                <div class="property-item">
                    <span>Porosity (dried):</span>
                    <strong>${result.porosity_percent_dried.toFixed(1)}%</strong>
                </div>
                <div class="property-item">
                    <span>Flowability:</span>
                    <strong>${result.flowabilityCategory}</strong>
                </div>
    `;

    if (maxTemp !== 'N/A') {
        html += `
                <div class="property-item">
                    <span>Bulk Density @ ${maxTemp}°C:</span>
                    <strong>${result.rhoBulk_gml_byTemp[maxTemp].toFixed(2)} g/ml</strong>
                </div>
                <div class="property-item">
                    <span>Porosity @ ${maxTemp}°C:</span>
                    <strong>${result.porosity_percent_byTemp[maxTemp].toFixed(1)}%</strong>
                </div>
        `;
    }

    html += `
            </div>
            
            <details style="margin-top: 15px;">
                <summary style="cursor: pointer; font-weight: bold;">📋 Blend Composition</summary>
                <table style="width: 100%; margin-top: 10px; font-size: 13px;">
                    <thead>
                        <tr style="background: #e8e8e8;">
                            <th>Fraction</th>
                            <th>Size Range</th>
                            <th>Material</th>
                            <th>Mass %</th>
                            <th>Type</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    // Check if there are fixed fractions
    const psdResult = result.intermediate?.psd;
    const fixedFractionIds = new Set(
        (psdResult?.fixedFractionsUsed || []).map(f => f.fractionId)
    );

    for (let i = 0; i < result.fractions.length; i++) {
        const fraction = result.fractions[i];
        const massPercent = result.massFractionsRoundedPercent[i];
        const material = materialLibrary.getMaterial(fraction.materialId);
        const isFixed = fixedFractionIds.has(fraction.id);

        const fixedLabel = isFixed
            ? '<span style="background: #fff3cd; padding: 2px 6px; border-radius: 3px; font-weight: bold;">FIXED</span>'
            : '<span style="color: #666;">optimized</span>';

        html += `
                        <tr style="${isFixed ? 'background: #fffdf0;' : ''}">
                            <td>${i + 1}</td>
                            <td>${fraction.dMin_mm}-${fraction.dMax_mm} mm</td>
                            <td>${material ? material.name : 'Unknown'}</td>
                            <td><strong>${massPercent}%</strong></td>
                            <td>${fixedLabel}</td>
                        </tr>
        `;
    }

    // Add summary if there are fixed fractions
    if (fixedFractionIds.size > 0 && psdResult) {
        html += `
                        <tr style="border-top: 2px solid #ddd; background: #f8f9fa;">
                            <td colspan="5" style="padding-top: 10px;">
                                <strong>Summary:</strong> 
                                ${fixedFractionIds.size} fixed fraction(s) = ${psdResult.totalFixedPercent?.toFixed(1)}%, 
                                ${psdResult.variableFractionsCount} optimized = ${(100 - (psdResult.totalFixedPercent || 0)).toFixed(1)}%
                            </td>
                        </tr>
        `;
    }

    html += `
                    </tbody>
                </table>
            </details>
            
            <div class="button-group">
                <button class="btn btn-small btn-success" onclick="saveResult(${index})">
                    💾 Save This Variant
                </button>
                <button class="btn btn-small btn-secondary" onclick="exportResult(${index})">
                    📥 Export JSON
                </button>
                <button class="btn btn-small btn-primary" onclick="useInPhaseCalculator(${index})">
                    → Use in Phase Calculator
                </button>
            </div>
        </div>
    `;

    return html;
}

/**
 * Save a specific result to library
 */
window.saveResult = function(index) {
    if (index < 0 || index >= currentResults.length) {
        alert('Invalid result index');
        return;
    }

    selectedResultIndex = index;

    // Pre-fill save modal
    const result = currentResults[index];
    document.getElementById('save-mix-name').value =
        `${result.method} q${result.q} ${result.scenario}`;
    document.getElementById('save-mix-description').value =
        `Optimized blend with ${result.packingEfficiency.toFixed(1)}% packing efficiency`;
    document.getElementById('save-mix-category').value = 'Custom Blends';
    document.getElementById('save-mix-tags').value =
        `${result.method.toLowerCase()}, q${result.q}, ${result.scenario.toLowerCase()}`;

    // Show modal
    document.getElementById('save-modal').style.display = 'block';
};

/**
 * Confirm save mix to library
 */
window.confirmSaveMix = function() {
    try {
        const name = document.getElementById('save-mix-name').value.trim();
        if (!name) {
            alert('Please enter a mix name');
            return;
        }

        const description = document.getElementById('save-mix-description').value.trim();
        const category = document.getElementById('save-mix-category').value.trim();
        const tagsText = document.getElementById('save-mix-tags').value.trim();
        const tags = tagsText ? tagsText.split(',').map(t => t.trim()) : [];

        const result = currentResults[selectedResultIndex];

        const savedMix = mixLibrary.saveMix(
            name,
            result.fractions,
            result,
            result.intermediate?.psd ? {
                method: result.method,
                q: result.q,
                scenario: result.scenario,
                packingModel: result.intermediate.packing.model
            } : {
                method: result.method,
                q: result.q,
                scenario: result.scenario,
                packingModel: 'CPM'
            },
            {
                description,
                category,
                tags
            }
        );

        alert(`Mix "${name}" saved to library!`);
        closeSaveModal();

    } catch (error) {
        alert('Error saving mix: ' + error.message);
        console.error(error);
    }
};

/**
 * Close save modal
 */
window.closeSaveModal = function() {
    document.getElementById('save-modal').style.display = 'none';
};

/**
 * Open library browser
 */
window.openLibraryBrowser = function() {
    refreshLibrary();
    document.getElementById('library-modal').style.display = 'block';
};

/**
 * Close library browser
 */
window.closeLibraryBrowser = function() {
    document.getElementById('library-modal').style.display = 'none';
};

/**
 * Refresh library list
 */
window.refreshLibrary = function() {
    const mixes = mixLibrary.getAllMixes();
    const container = document.getElementById('library-list');

    if (mixes.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No saved mixes yet.</p>';
        return;
    }

    let html = '';
    for (const mix of mixes) {
        const selected = mix.id === selectedLibraryMixId ? 'selected' : '';
        html += `
            <div class="mix-item ${selected}" onclick="selectLibraryMix('${mix.id}')">
                <h4>${mix.name}</h4>
                <p style="font-size: 13px; color: #666; margin: 5px 0;">
                    ${mix.description || 'No description'}
                </p>
                <div>
                    ${mix.tags ? mix.tags.map(t => `<span class="tag">${t}</span>`).join('') : ''}
                </div>
                <p style="font-size: 12px; color: #999; margin-top: 5px;">
                    ${mix.category || 'Uncategorized'} | 
                    Created: ${new Date(mix.createdDate).toLocaleDateString()}
                </p>
                <div class="button-group">
                    <button class="btn btn-small" onclick="event.stopPropagation(); deleteMix('${mix.id}')">
                        Delete
                    </button>
                    <button class="btn btn-small" onclick="event.stopPropagation(); exportMix('${mix.id}')">
                        Export
                    </button>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;

    // Update filters
    updateFilters();
};

/**
 * Select a mix from library
 */
window.selectLibraryMix = function(mixId) {
    selectedLibraryMixId = mixId;
    refreshLibrary();  // Re-render with selection
};

/**
 * Load selected mix into optimizer
 */
window.loadSelectedMix = function() {
    if (!selectedLibraryMixId) {
        alert('Please select a mix first');
        return;
    }

    const mix = mixLibrary.getMix(selectedLibraryMixId);
    if (!mix) {
        alert('Mix not found');
        return;
    }

    // Clear existing fractions
    document.getElementById('fraction-container').innerHTML = '';
    fractionCounter = 0;

    // Load composition
    for (const fraction of mix.composition) {
        addFraction();
        const row = document.getElementById(`fraction-${fractionCounter}`);
        row.querySelector('.dmin-input').value = fraction.dMin_mm;
        row.querySelector('.dmax-input').value = fraction.dMax_mm;
        row.querySelector('.material-select').value = fraction.materialId;
    }

    // Load optimization params
    document.getElementById('q-values').value = mix.optimizationParams.q.toString();

    closeLibraryBrowser();
    alert(`Mix "${mix.name}" loaded!`);
};

/**
 * Delete a mix
 */
window.deleteMix = function(mixId) {
    if (confirm('Are you sure you want to delete this mix?')) {
        mixLibrary.deleteMix(mixId);
        refreshLibrary();
    }
};

/**
 * Export a single mix
 */
window.exportMix = function(mixId) {
    const json = mixLibrary.exportToJSON([mixId]);
    downloadJSON(json, `mix_${mixId}.json`);
};

/**
 * Export entire library
 */
window.exportLibrary = function() {
    const json = mixLibrary.exportToJSON();
    downloadJSON(json, 'mix_library.json');
};

/**
 * Import library from JSON
 */
window.importLibrary = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const count = mixLibrary.importFromJSON(event.target.result, 'merge');
                    alert(`Imported ${count} mix(es) successfully!`);
                    refreshLibrary();
                } catch (error) {
                    alert('Error importing: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
};

/**
 * Helper: Download JSON
 */
function downloadJSON(jsonString, filename) {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Update filter dropdowns
 */
function updateFilters() {
    const categories = mixLibrary.getAllCategories();
    const tags = mixLibrary.getAllTags();

    const categorySelect = document.getElementById('library-category-filter');
    categorySelect.innerHTML = '<option value="">All Categories</option>' +
        categories.map(c => `<option value="${c}">${c}</option>`).join('');

    const tagSelect = document.getElementById('library-tag-filter');
    tagSelect.innerHTML = '<option value="">All Tags</option>' +
        tags.map(t => `<option value="${t}">${t}</option>`).join('');
}

/**
 * Filter library based on search/filters
 */
function filterLibrary(searchText) {
    // Simple client-side filtering
    // TODO: Implement with MixLibraryService.getAllMixes(filter)
    console.log('Filtering by:', searchText);
}

/**
 * Export a specific result
 */
window.exportResult = function(index) {
    const result = currentResults[index];
    const json = JSON.stringify(result, null, 2);
    downloadJSON(json, `blend_result_${index}.json`);
};

/**
 * Use result in phase calculator
 */
window.useInPhaseCalculator = function(index) {
    // Store in sessionStorage and redirect
    const result = currentResults[index];
    sessionStorage.setItem('loaded_blend', JSON.stringify(result));
    window.location.href = 'index.html?from=blend';
};

console.log('Blend Optimizer UI loaded');

