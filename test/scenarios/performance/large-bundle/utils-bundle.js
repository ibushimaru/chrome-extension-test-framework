// Utilities bundle with lots of unused code

// Duplicate implementations of common functions
const StringUtils = {
  capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1),
  capitalizeFirst: (str) => str.charAt(0).toUpperCase() + str.slice(1),
  capitalizeInitial: (str) => str.charAt(0).toUpperCase() + str.slice(1),
  upperFirst: (str) => str.charAt(0).toUpperCase() + str.slice(1),
  
  lowercase: (str) => str.toLowerCase(),
  lower: (str) => str.toLowerCase(),
  toLower: (str) => str.toLowerCase(),
  lowerCase: (str) => str.toLowerCase(),
  
  uppercase: (str) => str.toUpperCase(),
  upper: (str) => str.toUpperCase(),
  toUpper: (str) => str.toUpperCase(),
  upperCase: (str) => str.toUpperCase(),
  
  // Unnecessary string manipulation functions
  reverse: (str) => str.split('').reverse().join(''),
  reverseString: (str) => str.split('').reverse().join(''),
  stringReverse: (str) => str.split('').reverse().join(''),
  
  repeat: (str, n) => str.repeat(n),
  repeatString: (str, n) => str.repeat(n),
  stringRepeat: (str, n) => str.repeat(n),
  
  // ... imagine 50+ more variations
};

// Array utilities with multiple implementations
const ArrayUtils = {
  first: (arr) => arr[0],
  head: (arr) => arr[0],
  getFirst: (arr) => arr[0],
  firstElement: (arr) => arr[0],
  
  last: (arr) => arr[arr.length - 1],
  tail: (arr) => arr[arr.length - 1],
  getLast: (arr) => arr[arr.length - 1],
  lastElement: (arr) => arr[arr.length - 1],
  
  // Complex array operations
  shuffle: (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  },
  
  shuffleArray: (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  },
  
  randomize: (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  },
  
  // ... imagine 100+ more array utilities
};

// Math utilities (most are unused)
const MathUtils = {
  // Basic operations (unnecessary wrappers)
  add: (a, b) => a + b,
  sum: (a, b) => a + b,
  plus: (a, b) => a + b,
  
  subtract: (a, b) => a - b,
  minus: (a, b) => a - b,
  sub: (a, b) => a - b,
  
  multiply: (a, b) => a * b,
  mult: (a, b) => a * b,
  times: (a, b) => a * b,
  
  divide: (a, b) => a / b,
  div: (a, b) => a / b,
  over: (a, b) => a / b,
  
  // Complex math functions
  fibonacci: (n) => {
    if (n <= 1) return n;
    return MathUtils.fibonacci(n - 1) + MathUtils.fibonacci(n - 2);
  },
  
  factorial: (n) => {
    if (n <= 1) return 1;
    return n * MathUtils.factorial(n - 1);
  },
  
  isPrime: (n) => {
    if (n <= 1) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) {
      if (n % i === 0) return false;
    }
    return true;
  },
  
  // Matrix operations (completely unused in extension)
  matrixMultiply: (a, b) => {
    const result = [];
    for (let i = 0; i < a.length; i++) {
      result[i] = [];
      for (let j = 0; j < b[0].length; j++) {
        let sum = 0;
        for (let k = 0; k < b.length; k++) {
          sum += a[i][k] * b[k][j];
        }
        result[i][j] = sum;
      }
    }
    return result;
  },
  
  // ... imagine 50+ more math functions
};

// DOM utilities (redundant with modern APIs)
const DOMUtils = {
  getElementById: (id) => document.getElementById(id),
  getById: (id) => document.getElementById(id),
  byId: (id) => document.getElementById(id),
  
  getElementsByClass: (className) => document.getElementsByClassName(className),
  getByClass: (className) => document.getElementsByClassName(className),
  byClass: (className) => document.getElementsByClassName(className),
  
  querySelector: (selector) => document.querySelector(selector),
  query: (selector) => document.querySelector(selector),
  select: (selector) => document.querySelector(selector),
  
  querySelectorAll: (selector) => document.querySelectorAll(selector),
  queryAll: (selector) => document.querySelectorAll(selector),
  selectAll: (selector) => document.querySelectorAll(selector),
  
  // ... imagine 30+ more DOM utilities
};

// Validation utilities (overly complex)
const ValidationUtils = {
  isEmail: (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  },
  
  isValidEmail: (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  },
  
  validateEmail: (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  },
  
  // ... imagine 40+ more validators
};

// Export everything even though most won't be used
window.ExtensionUtils = {
  StringUtils,
  ArrayUtils,
  MathUtils,
  DOMUtils,
  ValidationUtils
};

console.log('Utils bundle loaded with', Object.keys(window.ExtensionUtils).length, 'utility categories');