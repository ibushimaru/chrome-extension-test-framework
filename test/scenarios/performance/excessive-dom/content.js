// Content script that creates excessive DOM elements

// Pattern 1: Creating thousands of elements at once
function createMassiveList() {
    const container = document.createElement('div');
    container.id = 'extension-massive-list';
    
    // Creating 10,000 list items
    for (let i = 0; i < 10000; i++) {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <span class="item-number">${i}</span>
            <span class="item-text">Item ${i}</span>
            <button class="item-button">Click</button>
            <div class="item-details">
                <p>Details for item ${i}</p>
                <ul>
                    <li>Property 1: ${Math.random()}</li>
                    <li>Property 2: ${Math.random()}</li>
                    <li>Property 3: ${Math.random()}</li>
                </ul>
            </div>
        `;
        container.appendChild(item);
    }
    
    document.body.appendChild(container);
}

// Pattern 2: Deep DOM nesting
function createDeepNesting() {
    let current = document.createElement('div');
    current.id = 'extension-deep-nesting';
    const root = current;
    
    // Creating 1000 levels of nesting
    for (let i = 0; i < 1000; i++) {
        const child = document.createElement('div');
        child.className = `level-${i}`;
        child.textContent = `Level ${i}`;
        current.appendChild(child);
        current = child;
    }
    
    document.body.appendChild(root);
}

// Pattern 3: Creating DOM in inefficient ways
function inefficientDOMCreation() {
    const container = document.createElement('div');
    container.id = 'extension-inefficient';
    
    // Using innerHTML in a loop (causes multiple reflows)
    for (let i = 0; i < 1000; i++) {
        container.innerHTML += `<div class="item">Item ${i}</div>`;
    }
    
    document.body.appendChild(container);
}

// Pattern 4: Invisible elements that still consume memory
function createInvisibleElements() {
    const container = document.createElement('div');
    container.id = 'extension-invisible';
    container.style.display = 'none';
    
    // Creating 5000 invisible elements
    for (let i = 0; i < 5000; i++) {
        const element = document.createElement('div');
        element.className = 'invisible-item';
        element.innerHTML = `
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==">
            <p>${'x'.repeat(1000)}</p>
        `;
        container.appendChild(element);
    }
    
    document.body.appendChild(container);
}

// Pattern 5: Complex DOM structures for simple data
function createComplexStructures() {
    const table = document.createElement('table');
    table.id = 'extension-complex-table';
    
    // Creating a 100x100 table (10,000 cells)
    for (let i = 0; i < 100; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < 100; j++) {
            const cell = document.createElement('td');
            cell.innerHTML = `
                <div class="cell-wrapper">
                    <div class="cell-content">
                        <span class="cell-value">${i},${j}</span>
                        <div class="cell-tooltip">
                            <p>Row: ${i}, Col: ${j}</p>
                            <p>Value: ${Math.random()}</p>
                        </div>
                    </div>
                </div>
            `;
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
    
    document.body.appendChild(table);
}

// Pattern 6: DOM elements with excessive attributes
function createAttributeHeavyElements() {
    const container = document.createElement('div');
    container.id = 'extension-attributes';
    
    for (let i = 0; i < 1000; i++) {
        const element = document.createElement('div');
        
        // Adding 100 data attributes to each element
        for (let j = 0; j < 100; j++) {
            element.setAttribute(`data-attr-${j}`, `value-${i}-${j}`);
        }
        
        element.className = new Array(50).fill(0).map((_, k) => `class-${k}`).join(' ');
        element.style.cssText = new Array(20).fill(0).map((_, k) => `--var-${k}: ${k}px`).join('; ');
        
        container.appendChild(element);
    }
    
    document.body.appendChild(container);
}

// Pattern 7: Continuously growing DOM
let growthInterval;
function startDOMGrowth() {
    const container = document.createElement('div');
    container.id = 'extension-growing';
    document.body.appendChild(container);
    
    let count = 0;
    growthInterval = setInterval(() => {
        const element = document.createElement('div');
        element.className = 'growing-item';
        element.innerHTML = `
            <p>Dynamic item ${count++}</p>
            <ul>
                ${new Array(10).fill(0).map((_, i) => `<li>Sub-item ${i}</li>`).join('')}
            </ul>
        `;
        container.appendChild(element);
        
        // No cleanup - just keeps growing
    }, 100);
}

// Pattern 8: Shadow DOM abuse
function createExcessiveShadowDOM() {
    const container = document.createElement('div');
    container.id = 'extension-shadow';
    
    // Creating 1000 shadow roots
    for (let i = 0; i < 1000; i++) {
        const host = document.createElement('div');
        host.className = 'shadow-host';
        
        const shadow = host.attachShadow({ mode: 'open' });
        shadow.innerHTML = `
            <style>
                :host { display: block; margin: 1px; }
                .content { padding: 10px; background: #f0f0f0; }
            </style>
            <div class="content">
                <h3>Shadow Content ${i}</h3>
                <p>${'Shadow DOM content '.repeat(10)}</p>
            </div>
        `;
        
        container.appendChild(host);
    }
    
    document.body.appendChild(container);
}

// Execute all patterns on page load
window.addEventListener('load', () => {
    createMassiveList();
    createDeepNesting();
    inefficientDOMCreation();
    createInvisibleElements();
    createComplexStructures();
    createAttributeHeavyElements();
    startDOMGrowth();
    createExcessiveShadowDOM();
    
    console.log('Excessive DOM created by extension');
});