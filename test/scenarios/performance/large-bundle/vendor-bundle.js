// Simulated vendor bundle with unnecessary dependencies

// Fake lodash (partial implementation)
const _ = {
  // Implementing every method even if unused
  chunk: function(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },
  compact: function(array) {
    return array.filter(Boolean);
  },
  concat: function(array, ...values) {
    return array.concat(...values);
  },
  difference: function(array, ...values) {
    const valuesSet = new Set(values.flat());
    return array.filter(x => !valuesSet.has(x));
  },
  drop: function(array, n = 1) {
    return array.slice(n);
  },
  dropRight: function(array, n = 1) {
    return array.slice(0, -n);
  },
  // ... imagine 100+ more methods
};

// Fake moment.js (huge date library)
const moment = (function() {
  const locales = {
    en: { months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] },
    es: { months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'] },
    fr: { months: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'] },
    de: { months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'] },
    // ... imagine 50+ more locales
  };
  
  return function(date) {
    return {
      format: function(fmt) { return new Date(date).toString(); },
      add: function(num, unit) { return this; },
      subtract: function(num, unit) { return this; },
      startOf: function(unit) { return this; },
      endOf: function(unit) { return this; },
      // ... imagine 50+ more methods
    };
  };
})();

// Fake jQuery (we're in an extension, we don't need this!)
const $ = function(selector) {
  const elements = document.querySelectorAll(selector);
  return {
    each: function(fn) { elements.forEach(fn); return this; },
    css: function(prop, value) { elements.forEach(el => el.style[prop] = value); return this; },
    html: function(content) { if (content !== undefined) { elements.forEach(el => el.innerHTML = content); } return this; },
    text: function(content) { if (content !== undefined) { elements.forEach(el => el.textContent = content); } return this; },
    addClass: function(className) { elements.forEach(el => el.classList.add(className)); return this; },
    removeClass: function(className) { elements.forEach(el => el.classList.remove(className)); return this; },
    // ... imagine 100+ more methods
  };
};

// Polyfill for ancient browsers (unnecessary in extensions)
if (!window.Promise) {
  window.Promise = function(executor) {
    // Fake promise implementation
  };
}

// Large utility library
const SuperUtils = {
  deepClone: function(obj) {
    return JSON.parse(JSON.stringify(obj));
  },
  debounce: function(func, wait) {
    let timeout;
    return function() {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, arguments), wait);
    };
  },
  throttle: function(func, limit) {
    let inThrottle;
    return function() {
      if (!inThrottle) {
        func.apply(this, arguments);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  // ... imagine 200+ more utility functions
};

// Huge constants object
const VENDOR_CONSTANTS = {
  COLORS: Array(1000).fill(null).reduce((acc, _, i) => {
    acc[`color_${i}`] = `#${Math.floor(Math.random()*16777215).toString(16)}`;
    return acc;
  }, {}),
  ICONS: Array(500).fill(null).reduce((acc, _, i) => {
    acc[`icon_${i}`] = `<svg><!-- Large SVG data --></svg>`;
    return acc;
  }, {}),
  TRANSLATIONS: Array(50).fill(null).reduce((acc, _, i) => {
    acc[`lang_${i}`] = Array(1000).fill(null).reduce((trans, _, j) => {
      trans[`key_${j}`] = `Translation ${j} for language ${i}`;
      return trans;
    }, {});
    return acc;
  }, {})
};

console.log('Vendor bundle loaded:', Object.keys({ _, moment, $, SuperUtils, VENDOR_CONSTANTS }));