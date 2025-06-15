// Popup with excessive DOM manipulation

// Pattern 1: Virtual list not implemented - rendering everything
function createMassivePopupList() {
    const container = document.getElementById('container');
    
    // Header
    const header = document.createElement('div');
    header.innerHTML = '<h2>Excessive DOM Popup</h2>';
    container.appendChild(header);
    
    // Creating 5000 items in popup (should use virtual scrolling)
    const list = document.createElement('div');
    list.id = 'popup-list';
    
    for (let i = 0; i < 5000; i++) {
        const item = document.createElement('div');
        item.className = 'popup-item';
        item.innerHTML = `
            <div class="item-header">
                <input type="checkbox" id="check-${i}">
                <label for="check-${i}">Item ${i}</label>
                <button class="delete-btn">Delete</button>
            </div>
            <div class="item-body">
                <p>Description for item ${i}</p>
                <div class="tags">
                    ${new Array(10).fill(0).map((_, j) => `<span class="tag">Tag ${j}</span>`).join('')}
                </div>
                <div class="actions">
                    <button>Edit</button>
                    <button>Share</button>
                    <button>Archive</button>
                </div>
            </div>
        `;
        
        // Adding event listeners to each item (memory leak potential)
        item.querySelector('.delete-btn').addEventListener('click', () => {
            console.log(`Delete item ${i}`);
        });
        
        item.querySelectorAll('.actions button').forEach(btn => {
            btn.addEventListener('click', function() {
                console.log(`Action on item ${i}`);
            });
        });
        
        list.appendChild(item);
    }
    
    container.appendChild(list);
}

// Pattern 2: Tabs with all content pre-rendered
function createIneffecientTabs() {
    const tabContainer = document.createElement('div');
    tabContainer.className = 'tab-container';
    
    // Creating 50 tabs with content
    const tabHeaders = document.createElement('div');
    tabHeaders.className = 'tab-headers';
    
    const tabContents = document.createElement('div');
    tabContents.className = 'tab-contents';
    
    for (let i = 0; i < 50; i++) {
        // Tab header
        const header = document.createElement('button');
        header.className = 'tab-header';
        header.textContent = `Tab ${i}`;
        tabHeaders.appendChild(header);
        
        // Tab content (all rendered, not lazy loaded)
        const content = document.createElement('div');
        content.className = 'tab-content';
        content.style.display = i === 0 ? 'block' : 'none';
        
        // Each tab has complex content
        content.innerHTML = `
            <h3>Tab ${i} Content</h3>
            <div class="tab-grid">
                ${new Array(100).fill(0).map((_, j) => `
                    <div class="grid-item">
                        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==">
                        <p>Grid item ${j}</p>
                    </div>
                `).join('')}
            </div>
        `;
        
        tabContents.appendChild(content);
    }
    
    tabContainer.appendChild(tabHeaders);
    tabContainer.appendChild(tabContents);
    document.getElementById('container').appendChild(tabContainer);
}

// Pattern 3: Nested accordions
function createNestedAccordions() {
    const accordion = document.createElement('div');
    accordion.className = 'accordion';
    
    // 3 levels of nested accordions
    for (let i = 0; i < 20; i++) {
        const section1 = document.createElement('div');
        section1.className = 'accordion-section level-1';
        section1.innerHTML = `<h4>Section ${i}</h4>`;
        
        const content1 = document.createElement('div');
        content1.className = 'accordion-content';
        
        for (let j = 0; j < 10; j++) {
            const section2 = document.createElement('div');
            section2.className = 'accordion-section level-2';
            section2.innerHTML = `<h5>Subsection ${i}.${j}</h5>`;
            
            const content2 = document.createElement('div');
            content2.className = 'accordion-content';
            
            for (let k = 0; k < 5; k++) {
                const section3 = document.createElement('div');
                section3.className = 'accordion-section level-3';
                section3.innerHTML = `
                    <h6>Item ${i}.${j}.${k}</h6>
                    <p>${'Content '.repeat(20)}</p>
                `;
                content2.appendChild(section3);
            }
            
            section2.appendChild(content2);
            content1.appendChild(section2);
        }
        
        section1.appendChild(content1);
        accordion.appendChild(section1);
    }
    
    document.getElementById('container').appendChild(accordion);
}

// Pattern 4: Real-time DOM updates
function startRealtimeUpdates() {
    const dashboard = document.createElement('div');
    dashboard.id = 'realtime-dashboard';
    document.getElementById('container').appendChild(dashboard);
    
    // Updating DOM every 100ms
    setInterval(() => {
        // Recreating entire dashboard instead of updating values
        dashboard.innerHTML = `
            <h3>Real-time Dashboard</h3>
            <div class="stats">
                ${new Array(20).fill(0).map((_, i) => `
                    <div class="stat-card">
                        <h4>Metric ${i}</h4>
                        <div class="value">${Math.random().toFixed(4)}</div>
                        <div class="chart">
                            ${new Array(10).fill(0).map(() => `
                                <div class="bar" style="height: ${Math.random() * 100}px"></div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }, 100);
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    createMassivePopupList();
    createIneffecientTabs();
    createNestedAccordions();
    startRealtimeUpdates();
});