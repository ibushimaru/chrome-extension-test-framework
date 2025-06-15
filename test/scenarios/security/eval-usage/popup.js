// Popup script with dangerous eval patterns

// BAD: Direct eval usage
document.getElementById('evalButton').addEventListener('click', () => {
  const code = document.getElementById('codeInput').value;
  try {
    // DANGEROUS: Direct eval of user input
    const result = eval(code);
    document.getElementById('output').textContent = 'Result: ' + result;
  } catch (error) {
    document.getElementById('output').textContent = 'Error: ' + error.message;
  }
});

// BAD: Function constructor usage
document.getElementById('functionButton').addEventListener('click', () => {
  const code = document.getElementById('codeInput').value;
  try {
    // DANGEROUS: Function constructor with user input
    const func = new Function(code);
    const result = func();
    document.getElementById('output').textContent = 'Result: ' + result;
  } catch (error) {
    document.getElementById('output').textContent = 'Error: ' + error.message;
  }
});

// BAD: eval for math expressions
document.getElementById('calculateButton').addEventListener('click', () => {
  const expression = document.getElementById('mathExpression').value;
  try {
    // DANGEROUS: eval for calculations
    const result = eval(expression);
    document.getElementById('output').textContent = 'Result: ' + result;
  } catch (error) {
    document.getElementById('output').textContent = 'Error: ' + error.message;
  }
});

// BAD: setTimeout with string
document.getElementById('setTimeoutButton').addEventListener('click', () => {
  const code = document.getElementById('timerCode').value;
  // DANGEROUS: setTimeout with string (acts like eval)
  setTimeout(code, 1000);
  document.getElementById('output').textContent = 'Timer set for 1 second';
});

// BAD: setInterval with string
document.getElementById('setIntervalButton').addEventListener('click', () => {
  const code = document.getElementById('timerCode').value;
  // DANGEROUS: setInterval with string (acts like eval)
  const intervalId = setInterval(code, 2000);
  document.getElementById('output').textContent = 'Interval set for every 2 seconds';
  
  // Stop after 10 seconds
  setTimeout(() => clearInterval(intervalId), 10000);
});

// BAD: Dynamic property access with eval
function getNestedProperty(obj, path) {
  // DANGEROUS: Using eval for property access
  return eval(`obj.${path}`);
}

// BAD: Template evaluation
function evaluateTemplate(template, context) {
  // DANGEROUS: Creating and executing dynamic code
  const func = new Function('context', `with(context) { return \`${template}\`; }`);
  return func(context);
}

// BAD: JSON parsing with eval (old school anti-pattern)
function parseJsonUnsafe(jsonString) {
  // DANGEROUS: Never use eval to parse JSON!
  return eval('(' + jsonString + ')');
}

// Store code for later execution
document.getElementById('codeInput').addEventListener('change', (e) => {
  // BAD: Storing code that will be eval'd later
  chrome.storage.local.set({customCode: e.target.value});
});