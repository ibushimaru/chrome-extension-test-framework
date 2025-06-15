// Popup script with huge bundle but minimal actual functionality

// Import everything even though we need almost nothing
const { Library1, Library2, Library3, ArrayHelpers, StringHelpers, DOMHelpers, CONSTANTS } = window;

// Actual popup logic (5 lines of code)
document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    app.innerHTML += '<p>Ready!</p>';
});

// The rest is bundled unnecessary code...

// Huge configuration object
const POPUP_CONFIG = {
    themes: {
        light: {
            colors: new Array(100).fill(0).reduce((acc, _, i) => {
                acc[`color${i}`] = `hsl(${i * 3.6}, 70%, 50%)`;
                return acc;
            }, {}),
            fonts: new Array(50).fill(0).map((_, i) => ({
                name: `Font${i}`,
                family: 'Arial, sans-serif',
                size: `${12 + i}px`,
                weight: 100 + (i * 10)
            }))
        },
        dark: {
            colors: new Array(100).fill(0).reduce((acc, _, i) => {
                acc[`color${i}`] = `hsl(${i * 3.6}, 70%, 30%)`;
                return acc;
            }, {}),
            fonts: new Array(50).fill(0).map((_, i) => ({
                name: `Font${i}`,
                family: 'Arial, sans-serif',
                size: `${12 + i}px`,
                weight: 100 + (i * 10)
            }))
        }
    },
    
    animations: new Array(200).fill(0).map((_, i) => ({
        name: `animation${i}`,
        duration: `${i * 100}ms`,
        easing: 'ease-in-out',
        keyframes: [
            { transform: 'scale(1)', opacity: 1 },
            { transform: `scale(${1 + i * 0.01})`, opacity: 0.5 },
            { transform: 'scale(1)', opacity: 1 }
        ]
    })),
    
    components: new Array(100).fill(0).map((_, i) => ({
        id: `component${i}`,
        template: `<div class="component-${i}">${'x'.repeat(100)}</div>`,
        styles: `.component-${i} { padding: ${i}px; }`,
        handlers: {
            onClick: () => console.log(`Component ${i} clicked`),
            onHover: () => console.log(`Component ${i} hovered`)
        }
    }))
};

// Unused feature flags
const FEATURES = new Array(500).fill(0).reduce((acc, _, i) => {
    acc[`FEATURE_${i}`] = {
        enabled: false,
        name: `Feature ${i}`,
        description: `This is feature number ${i}`,
        dependencies: [`FEATURE_${(i + 1) % 500}`, `FEATURE_${(i + 2) % 500}`],
        config: {
            option1: 'value1',
            option2: 'value2',
            data: new Array(100).fill(`data${i}`)
        }
    };
    return acc;
}, {});

// Analytics code that's way too complex
class Analytics {
    constructor() {
        this.events = [];
        this.sessions = [];
        this.metrics = {};
        
        // Pre-generate tons of data
        for (let i = 0; i < 1000; i++) {
            this.metrics[`metric_${i}`] = {
                name: `Metric ${i}`,
                value: 0,
                history: new Array(100).fill(0),
                aggregations: {
                    sum: 0,
                    avg: 0,
                    min: 0,
                    max: 0,
                    median: 0
                }
            };
        }
    }
    
    track(event) {
        // Overly complex tracking
        this.events.push({
            ...event,
            timestamp: Date.now(),
            session: this.getCurrentSession(),
            metrics: { ...this.metrics },
            context: {
                url: window.location.href,
                userAgent: navigator.userAgent,
                screen: {
                    width: window.screen.width,
                    height: window.screen.height,
                    colorDepth: window.screen.colorDepth
                }
            }
        });
    }
    
    getCurrentSession() {
        // Unnecessary session management
        return {
            id: Math.random().toString(36),
            start: Date.now(),
            events: [...this.events],
            metrics: { ...this.metrics }
        };
    }
}

const analytics = new Analytics();

// Initialize everything even though we don't use it
console.log('Loaded:', {
    library1Methods: Object.keys(Library1.dateUtils).length,
    library2Methods: Object.keys(Library2.array).length,
    library3Methods: Object.keys(Library3.prototype).length,
    configThemes: Object.keys(POPUP_CONFIG.themes).length,
    features: Object.keys(FEATURES).length
});