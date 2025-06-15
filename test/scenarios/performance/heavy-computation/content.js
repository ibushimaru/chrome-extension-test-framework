// Heavy computation in content script that affects page performance

// Pattern 1: Synchronous DOM manipulation in loops
function heavyDOMOperation() {
    for (let i = 0; i < 1000; i++) {
        const div = document.createElement('div');
        div.textContent = `Item ${i}`;
        document.body.appendChild(div);
        // Force layout recalculation
        const height = div.offsetHeight;
        div.style.transform = `translateY(${height}px)`;
    }
}

// Pattern 2: Blocking scroll event handler
document.addEventListener('scroll', () => {
    // Heavy calculation on every scroll event
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
        sum += Math.sqrt(i);
    }
    console.log('Scroll calculation:', sum);
});

// Pattern 3: Synchronous image processing
function processImages() {
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
        // Simulating heavy image processing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Pixel manipulation (very slow)
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            // Complex filter calculation
            data[i] = Math.sin(data[i]) * 255;
            data[i + 1] = Math.cos(data[i + 1]) * 255;
            data[i + 2] = Math.tan(data[i + 2]) * 255;
        }
        
        ctx.putImageData(imageData, 0, 0);
    });
}

// Pattern 4: Blocking text analysis
function analyzePageText() {
    const text = document.body.innerText;
    const words = text.split(/\s+/);
    
    // Inefficient word frequency calculation
    const frequency = {};
    for (let i = 0; i < words.length; i++) {
        for (let j = 0; j < words.length; j++) {
            if (words[i] === words[j]) {
                frequency[words[i]] = (frequency[words[i]] || 0) + 1;
            }
        }
    }
    
    return frequency;
}

// Pattern 5: Heavy computation on page load
window.addEventListener('load', () => {
    heavyDOMOperation();
    processImages();
    analyzePageText();
});

// Pattern 6: Blocking animation loop
function blockingAnimation() {
    const elements = document.querySelectorAll('*');
    elements.forEach((el, index) => {
        // Heavy calculation for each element
        const angle = Math.sin(Date.now() / 1000 + index) * 360;
        el.style.transform = `rotate(${angle}deg)`;
    });
    // No requestAnimationFrame - blocks the main thread
    setTimeout(blockingAnimation, 16);
}

// Start blocking animation
blockingAnimation();