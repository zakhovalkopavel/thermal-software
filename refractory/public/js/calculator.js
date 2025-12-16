// Refractory Calculator - Browser UI Logic
// Uses the API backend instead of direct module imports

let selectedComponents = [];
let componentsData = null;

// Note: Particle size constants are loaded from particle-size-constants.js
// Available as: ParticleSizeConstants.classifications, ParticleSizeConstants.meshToMm, etc.

// Initialize
window.addEventListener('DOMContentLoaded', async function() {
    try {
        // Load component list from API
        const response = await fetch('http://localhost:3010/api/components');
        if (!response.ok) {
            throw new Error('Failed to load components from API');
        }

        componentsData = await response.json();

        // Populate component dropdown
        const componentSelect = document.getElementById('component-select');
        componentsData.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
            componentSelect.appendChild(option);
        });

        // Component select change handler
        componentSelect.addEventListener('change', function() {
            const variantSelect = document.getElementById('variant-select');
            variantSelect.innerHTML = '<option value="">-- Select variant --</option>';

            if (this.value) {
                variantSelect.disabled = false;
                const variants = componentsData.components[this.value] || [];
                variants.forEach(variant => {
                    const option = document.createElement('option');
                    option.value = variant;
                    option.textContent = variant.charAt(0).toUpperCase() + variant.slice(1).replace(/_/g, ' ');
                    variantSelect.appendChild(option);
                });
            } else {
                variantSelect.disabled = true;
            }
        });

        // Particle size type change handler
        const particleSizeType = document.getElementById('particle-size-type');
        const particleSizeInput = document.getElementById('particle-size-input');

        particleSizeType.addEventListener('change', function() {
            const type = this.value;
            if (type === 'default') {
                particleSizeInput.style.display = 'none';
                particleSizeInput.innerHTML = '';
                return;
            }

            particleSizeInput.style.display = 'block';

            if (type === 'classification') {
                let html = '<label>Classification:</label><select id="particle-classification">';
                for (const [key, cls] of Object.entries(ParticleSizeConstants.classifications)) {
                    html += `<option value="${key}">${cls.name}</option>`;
                }
                html += '</select>';
                particleSizeInput.innerHTML = html;
            } else if (type === 'mesh') {
                const meshSizes = ParticleSizeConstants.getMeshSizes();
                let html = '<label>Mesh Range:</label><div style="display: flex; gap: 10px;">';
                html += '<select id="mesh-lower">';
                meshSizes.forEach(m => html += `<option value="${m}">${m}</option>`);
                html += '</select><span>to</span><select id="mesh-upper">';
                meshSizes.forEach(m => html += `<option value="${m}">${m}</option>`);
                html += '</select></div>';
                particleSizeInput.innerHTML = html;
                document.getElementById('mesh-upper').value = '30';
            } else if (type === 'fepa') {
                const fepaF = ParticleSizeConstants.getFepaF();
                const fepaP = ParticleSizeConstants.getFepaP();
                let html = '<label>FEPA Designation:</label><select id="fepa-designation">';
                html += '<optgroup label="F Series (Macrogrits)">';
                fepaF.forEach(f => html += `<option value="${f}">${f}</option>`);
                html += '</optgroup><optgroup label="P Series (Microgrits)">';
                fepaP.forEach(p => html += `<option value="${p}">${p}</option>`);
                html += '</optgroup></select>';
                particleSizeInput.innerHTML = html;
            } else if (type === 'custom') {
                particleSizeInput.innerHTML = `
                    <label>Custom Range (mm):</label>
                    <div style="display: flex; gap: 10px;">
                        <input type="number" id="custom-lower" placeholder="Lower" min="0.001" step="0.001" style="width: 100px;">
                        <span>to</span>
                        <input type="number" id="custom-upper" placeholder="Upper" min="0.001" step="0.001" style="width: 100px;">
                    </div>
                `;
            }
        });

        console.log('✅ Calculator initialized successfully');
    } catch (error) {
        console.error('❌ Initialization error:', error);
        document.getElementById('results-container').innerHTML = `
            <div class="error">
                <strong>Initialization Error:</strong><br>
                ${error.message}<br><br>
                <small>Make sure the API server is running on port 3010</small>
            </div>
        `;
    }
});

function addComponent() {
    const categorySelect = document.getElementById('component-select');
    const variantSelect = document.getElementById('variant-select');
    const amountInput = document.getElementById('amount-input');
    const particleSizeType = document.getElementById('particle-size-type').value;

    const category = categorySelect.value;
    const variant = variantSelect.value;
    const parts = parseFloat(amountInput.value);

    if (!category || !variant) {
        alert('Please select a component and variant');
        return;
    }

    if (isNaN(parts) || parts <= 0) {
        alert('Please enter a valid amount (parts by weight)');
        return;
    }

    // Get particle size if specified
    let particleSize = null;
    if (particleSizeType !== 'default') {
        particleSize = getParticleSize(particleSizeType);
        if (!particleSize) {
            alert('Please specify particle size');
            return;
        }
    }

    // Add component to list
    const component = {
        category,
        variant,
        parts,
        name: `${category} (${variant})`,
        particleSize: particleSize
    };

    selectedComponents.push(component);
    updateComponentsList();

    // Reset form
    categorySelect.value = '';
    variantSelect.innerHTML = '<option value="">-- Select variant --</option>';
    variantSelect.disabled = true;
    amountInput.value = '1';
    document.getElementById('particle-size-type').value = 'default';
    document.getElementById('particle-size-input').style.display = 'none';
    document.getElementById('particle-size-input').innerHTML = '';
}

function getParticleSize(type) {
    if (type === 'classification') {
        const key = document.getElementById('particle-classification').value;
        const cls = ParticleSizeConstants.classifications[key];
        return {
            type: 'classification',
            name: cls.name,
            lowerSize: cls.minSize,
            upperSize: cls.maxSize
        };
    } else if (type === 'mesh') {
        const lowerMesh = parseInt(document.getElementById('mesh-lower').value);
        const upperMesh = parseInt(document.getElementById('mesh-upper').value);
        if (lowerMesh >= upperMesh) {
            alert('Lower mesh must be < upper mesh');
            return null;
        }
        const meshToMm = ParticleSizeConstants.meshToMm;
        return {
            type: 'mesh',
            name: `${lowerMesh}-${upperMesh} mesh`,
            lowerSize: meshToMm[upperMesh],
            upperSize: meshToMm[lowerMesh]
        };
    } else if (type === 'fepa') {
        const designation = document.getElementById('fepa-designation').value;
        const fepaF = ParticleSizeConstants.fepaF;
        const fepaP = ParticleSizeConstants.fepaP;
        const size = fepaF[designation] || fepaP[designation];
        if (!size) {
            alert('Unknown FEPA designation');
            return null;
        }
        return {
            type: 'fepa',
            name: `FEPA ${designation}`,
            lowerSize: size * 0.8,
            upperSize: size * 1.2
        };
    } else if (type === 'custom') {
        const lower = parseFloat(document.getElementById('custom-lower').value);
        const upper = parseFloat(document.getElementById('custom-upper').value);
        if (isNaN(lower) || isNaN(upper) || lower >= upper) {
            alert('Invalid custom range');
            return null;
        }
        return {
            type: 'custom',
            name: `${lower}-${upper} mm`,
            lowerSize: lower,
            upperSize: upper
        };
    }
    return null;
}

function removeComponent(index) {
    selectedComponents.splice(index, 1);
    updateComponentsList();
}

function updateComponentsList() {
    const listDiv = document.getElementById('components-list');
    const totalInfo = document.getElementById('total-info');

    if (selectedComponents.length === 0) {
        listDiv.innerHTML = '<p style="color: #666; text-align: center;">No components added yet</p>';
        totalInfo.style.display = 'none';
        return;
    }

    // Calculate total parts
    const totalParts = selectedComponents.reduce((sum, comp) => sum + comp.parts, 0);

    let html = '';
    selectedComponents.forEach((comp, index) => {
        const percentage = (comp.parts / totalParts * 100).toFixed(1);
        html += `
            <div class="component-item">
                <div class="component-info">
                    <div class="component-name">${comp.name}</div>
                    <div class="component-variant">
                        Parts: ${comp.parts} → ${percentage}%
                        ${comp.particleSize ? `<br>Size: ${comp.particleSize.name}` : ''}
                    </div>
                </div>
                <button class="btn-danger" onclick="removeComponent(${index})">✕</button>
            </div>
        `;
    });

    listDiv.innerHTML = html;

    // Show total info
    totalInfo.style.display = 'block';
    document.getElementById('total-parts').textContent = totalParts.toFixed(2);
}

async function calculate() {
    if (selectedComponents.length === 0) {
        alert('Please add at least one component');
        return;
    }

    const temperature = parseFloat(document.getElementById('temperature-input').value);
    const resultsContainer = document.getElementById('results-container');
    const loadingDiv = document.getElementById('loading');

    // Show loading
    loadingDiv.style.display = 'block';
    resultsContainer.innerHTML = '';
    resultsContainer.appendChild(loadingDiv);

    try {
        // Calculate percentages from parts
        const totalParts = selectedComponents.reduce((sum, comp) => sum + comp.parts, 0);

        // Prepare components with percentages and particle sizes
        const components = selectedComponents.map(c => {
            const comp = {
                category: c.category,
                variant: c.variant,
                amount: (c.parts / totalParts * 100)
            };

            // Add particle size if specified
            if (c.particleSize) {
                comp.fractions = [{
                    lowerSize: c.particleSize.lowerSize,
                    upperSize: c.particleSize.upperSize,
                    amount: 100
                }];
            }

            return comp;
        });

        // Call API
        const response = await fetch('http://localhost:3010/api/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                components,
                temperature
            })
        });

        if (!response.ok) {
            throw new Error('Calculation failed');
        }

        const result = await response.json();

        // Display results
        setTimeout(() => {
            displayResults(result, temperature);
        }, 500);

    } catch (error) {
        console.error('Calculation error:', error);
        resultsContainer.innerHTML = `
            <div class="error">
                <strong>Calculation Error:</strong><br>
                ${error.message}<br><br>
                <small>Check that the API server is running on port 3010</small>
            </div>
        `;
    }
}

function displayResults(result, temperature) {
    const container = document.getElementById('results-container');

    let html = `
        <div class="results">
            <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">📈 Calculation Results</h2>
            
            <div class="result-item">
                <div class="result-label">🌡️ Temperature</div>
                <div class="result-value">${temperature}°C</div>
            </div>

            <div class="result-item">
                <div class="result-label">💧 Liquid Phase</div>
                <div class="result-value">${result.liquid.percent.toFixed(2)}%</div>
            </div>

            <div class="result-item">
                <div class="result-label">🧱 Solid Phase</div>
                <div class="result-value">${result.solid.percent.toFixed(2)}%</div>
            </div>

            ${result.liquid.viscosity ? `
            <div class="result-item">
                <div class="result-label">🌊 Viscosity</div>
                <div class="result-value">${result.liquid.viscosity.toFixed(3)} Pa·s</div>
            </div>
            ` : ''}

            <div class="result-item">
                <div class="result-label">🔥 Refractoriness</div>
                <div class="result-value">${result.thermalPerformance.refractoriness}°C</div>
            </div>

            <div class="result-item">
                <div class="result-label">⚖️ RUL (0.2 MPa)</div>
                <div class="result-value">${result.thermalPerformance.deformationTemperature_0_2MPa}°C</div>
            </div>

            <h3 style="margin-top: 30px; color: #667eea;">🧪 Liquid Composition (Top Oxides)</h3>
            <table class="composition-table">
                <thead>
                    <tr>
                        <th>Oxide</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    ${formatComposition(result.liquid.composition, 5)}
                </tbody>
            </table>

            <h3 style="margin-top: 30px; color: #667eea;">🧱 Solid Composition (Top Oxides)</h3>
            <table class="composition-table">
                <thead>
                    <tr>
                        <th>Oxide</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    ${formatComposition(result.solid.composition, 5)}
                </tbody>
            </table>

            <h3 style="margin-top: 30px; color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                🔬 Phase Composition AT TEST TEMPERATURE (${temperature}°C)
            </h3>
            <p style="color: #666; font-style: italic; margin-bottom: 15px;">
                What phases exist while the sample is at temperature:
            </p>

            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #ff6b6b;">
                <h4 style="color: #c92a2a; margin-bottom: 10px;">🔴 Liquid Phase: ${result.liquid.percent.toFixed(2)}%</h4>
                <p style="margin: 5px 0;">• Actually molten, flowing material</p>
                <p style="margin: 5px 0;">• CaO-enriched: ${result.liquid.composition.CaO?.toFixed(2)}%</p>
                <p style="margin: 5px 0;">• Al₂O₃: ${result.liquid.composition.Al2O3?.toFixed(2)}%</p>
                <p style="margin: 5px 0;">• SiO₂: ${result.liquid.composition.SiO2?.toFixed(2)}%</p>
                ${result.liquid.viscosity ? `<p style="margin: 5px 0;">• Viscosity: ${result.liquid.viscosity.toFixed(3)} Pa·s</p>` : ''}
            </div>

            <div style="background: #e7f5ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #228be6;">
                <h4 style="color: #1864ab; margin-bottom: 10px;">⚪ Solid Phase: ${result.solid.percent.toFixed(2)}%</h4>
                <p style="margin: 5px 0;">• Crystalline minerals (mullite, quartz, etc.)</p>
                <p style="margin: 5px 0;">• Al₂O₃-enriched: ${result.solid.composition.Al2O3?.toFixed(2)}%</p>
                <p style="margin: 5px 0;">• SiO₂: ${result.solid.composition.SiO2?.toFixed(2)}%</p>
                <p style="margin: 5px 0;">• CaO: ${result.solid.composition.CaO?.toFixed(2)}%</p>
                <p style="margin: 5px 0;">• Some amorphous/disordered structure</p>
            </div>

            ${result.solid.mineralogy && result.solid.mineralogy.length > 0 ? `
            <h3 style="margin-top: 30px; color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                🏺 FINAL MICROSTRUCTURE (After Cooling to Room Temperature)
            </h3>
            <p style="color: #666; font-style: italic; margin-bottom: 15px;">
                Note: This shows phases in the cooled/fired product. The liquid at ${temperature}°C transforms into glass during cooling.
            </p>
            ${formatMineralogy(result.solid.mineralogy)}
            ` : ''}

            ${result.refractorinessEvaluation ? `
            <h3 style="margin-top: 30px; color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                📏 Refractoriness Standards Evaluation
            </h3>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <h4 style="color: #495057; margin-bottom: 10px;">EN ISO 1893 (Refractoriness Under Load @ 0.2 MPa):</h4>
                <p style="margin: 5px 0;">• T₀.₅ (0.5% deformation): <strong>${result.refractorinessEvaluation.enISO1893.T05}°C</strong></p>
                <p style="margin: 5px 0;">• T₁ (1% deformation): <strong>${result.refractorinessEvaluation.enISO1893.T1}°C</strong></p>
                <p style="margin: 5px 0;">• T₂ (2% deformation): <strong>${result.refractorinessEvaluation.enISO1893.T2}°C</strong></p>
            </div>

            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <h4 style="color: #495057; margin-bottom: 10px;">ASTM C24/C71:</h4>
                <p style="margin: 5px 0;">• PCE (Pyrometric Cone Equivalent): <strong>${result.refractorinessEvaluation.astmPCE}°C</strong></p>
            </div>

            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <h4 style="color: #495057; margin-bottom: 10px;">GOST 4069-69:</h4>
                <p style="margin: 5px 0;">• Cone Softening Temperature: <strong>${result.refractorinessEvaluation.gostCone}°C</strong></p>
            </div>

            <div style="background: #e9ecef; padding: 15px; border-radius: 8px;">
                <h4 style="color: #495057; margin-bottom: 10px;">Models Used:</h4>
                ${Object.entries(result.refractorinessEvaluation.modelsSummary).map(([model, desc]) => 
                    `<p style="margin: 5px 0; font-size: 0.9em;"><strong>${model}:</strong> ${desc}</p>`
                ).join('')}
            </div>
            ` : ''}

            ${result.diagnostics.warnings.length > 0 ? `
            <div class="warning" style="margin-top: 20px;">
                <div class="warning-title">⚠️ Warnings:</div>
                <ul style="margin-top: 10px;">
                    ${result.diagnostics.warnings.map(w => `<li>${w}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
    `;

    container.innerHTML = html;
}

function formatComposition(composition, limit = 10) {
    return Object.entries(composition)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([oxide, percent]) => `
            <tr>
                <td>${oxide}</td>
                <td>${percent.toFixed(2)}%</td>
            </tr>
        `).join('');
}

function formatMineralogy(mineralogy) {
    return mineralogy
        .filter(phase => phase.percent > 1)
        .sort((a, b) => b.percent - a.percent)
        .map(phase => {
            let phaseHtml = `
                <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #667eea;">
                    <h4 style="color: #667eea; margin-bottom: 10px;">
                        ${phase.phase} (${phase.formula}): ${phase.percent.toFixed(1)}%
                    </h4>
            `;

            if (phase.phase === 'Amorphous') {
                if (phase.viscosityPoints) {
                    const vp = phase.viscosityPoints;
                    phaseHtml += `
                        <p style="margin: 10px 0; font-weight: 600;">Viscosity Fixed Points (ASTM C965):</p>
                        <div style="margin-left: 15px; font-size: 0.95em;">
                            <p style="margin: 5px 0;">• Melting point: ${vp.melting}°C (η = 1 Pa·s = 10 poise)</p>
                            <p style="margin: 5px 0;">• Flow point: ${vp.flow}°C (η = 10⁴ Pa·s = 10⁵ poise)</p>
                            <p style="margin: 5px 0;">• Working point: ${vp.working}°C (η = 10³ Pa·s = 10⁴ poise)</p>
                            <p style="margin: 5px 0;">• Softening point: ${vp.softening}°C (η = 10^6.6 Pa·s = 10^7.6 poise)</p>
                            <p style="margin: 5px 0;">• Annealing point: ${vp.annealing}°C (η = 10¹² Pa·s = 10¹³ poise)</p>
                            <p style="margin: 5px 0;">• Strain point: ${vp.strain}°C (η = 10^13.5 Pa·s = 10^14.5 poise)</p>
                        </div>
                        <p style="margin: 10px 0 5px 0;">Glass transition: ${vp.glassTransitionRange || 'N/A'}</p>
                    `;
                }
            } else {
                phaseHtml += `<p style="margin: 5px 0;">Melting point: ${phase.meltingPoint}°C</p>`;
            }

            phaseHtml += `</div>`;
            return phaseHtml;
        }).join('');
}

