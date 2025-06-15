// Heavy computation patterns in popup that freeze the UI

// Pattern 1: Recursive Fibonacci (exponential time complexity)
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

// Pattern 2: Inefficient prime checking
function isPrime(num) {
    for (let i = 2; i < num; i++) {
        if (num % i === 0) return false;
    }
    return num > 1;
}

// Pattern 3: Bubble sort on large array
function bubbleSort(arr) {
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            }
        }
    }
    return arr;
}

// UI freezing computations
document.getElementById('fibonacci').addEventListener('click', () => {
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = 'Computing Fibonacci(40)...';
    
    // This will freeze the UI
    const start = Date.now();
    const result = fibonacci(40);
    const elapsed = Date.now() - start;
    
    resultDiv.textContent = `Fibonacci(40) = ${result} (took ${elapsed}ms)`;
});

document.getElementById('prime').addEventListener('click', () => {
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = 'Finding primes...';
    
    // Blocking prime calculation
    const start = Date.now();
    const primes = [];
    for (let i = 2; i < 100000; i++) {
        if (isPrime(i)) {
            primes.push(i);
        }
    }
    const elapsed = Date.now() - start;
    
    resultDiv.textContent = `Found ${primes.length} primes (took ${elapsed}ms)`;
});

document.getElementById('sort').addEventListener('click', () => {
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = 'Sorting array...';
    
    // Creating and sorting large array synchronously
    const start = Date.now();
    const array = new Array(1000000).fill(0).map(() => Math.random());
    
    // Multiple inefficient operations
    const sorted = bubbleSort(array.slice(0, 10000)); // Even 10k is too much for bubble sort
    const elapsed = Date.now() - start;
    
    resultDiv.textContent = `Sorted array (took ${elapsed}ms)`;
});

// Pattern 4: Continuous heavy computation
let computing = false;
setInterval(() => {
    if (!computing) {
        computing = true;
        // Unnecessary repeated calculations
        let sum = 0;
        for (let i = 0; i < 1000000; i++) {
            sum += Math.sqrt(i) * Math.log(i + 1);
        }
        computing = false;
    }
}, 1000);