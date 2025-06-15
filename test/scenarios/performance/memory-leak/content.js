// Memory leak patterns in content script

// Pattern 1: DOM references that prevent garbage collection
const elementCache = [];
document.addEventListener('click', (event) => {
    // Storing all clicked elements without cleanup
    elementCache.push({
        element: event.target,
        timestamp: Date.now(),
        path: event.composedPath()
    });
});

// Pattern 2: Event listeners on elements that might be removed
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
                // Adding listeners without cleanup
                node.addEventListener('mouseover', function() {
                    console.log('Hovering:', this);
                });
                node.addEventListener('click', function() {
                    console.log('Clicked:', this);
                });
            }
        });
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Pattern 3: Detached DOM nodes
const detachedNodes = [];
setInterval(() => {
    const div = document.createElement('div');
    div.innerHTML = '<p>Temporary element with data</p>';
    div.dataset.largeData = new Array(1000).fill('data').join('');
    
    document.body.appendChild(div);
    setTimeout(() => {
        document.body.removeChild(div);
        // Keeping reference to removed node
        detachedNodes.push(div);
    }, 100);
}, 500);

// Pattern 4: Circular references with DOM
const circularRefs = [];
document.querySelectorAll('*').forEach((element, index) => {
    const wrapper = {
        element: element,
        index: index,
        data: new Array(100).fill('leak')
    };
    // Creating circular reference
    element._wrapper = wrapper;
    wrapper.self = wrapper;
    circularRefs.push(wrapper);
});

// Pattern 5: Large data in closures
function attachHeavyListeners() {
    const hugeArray = new Array(100000).fill('memory');
    
    document.addEventListener('scroll', () => {
        // Closure keeps reference to hugeArray
        if (hugeArray.length > 0) {
            console.log('Scrolling with', hugeArray.length, 'items');
        }
    });
}
attachHeavyListeners();