// Content script with eval usage

// BAD: Evaluating code from page
function executePageCode() {
  const codeElement = document.querySelector('[data-execute]');
  if (codeElement) {
    const code = codeElement.getAttribute('data-execute');
    // DANGEROUS: Executing code from DOM
    eval(code);
  }
}

// BAD: Creating functions from strings
function createHandler(handlerCode) {
  // DANGEROUS: Creating event handler from string
  return new Function('event', handlerCode);
}

// BAD: Dynamic style injection with eval
function injectDynamicStyles(cssExpression) {
  const style = document.createElement('style');
  // DANGEROUS: Using eval to process CSS
  style.textContent = eval(`\`${cssExpression}\``);
  document.head.appendChild(style);
}

// BAD: Message handler that executes code
window.addEventListener('message', (event) => {
  if (event.data.type === 'EXECUTE_CODE') {
    try {
      // DANGEROUS: Executing code from postMessage
      const result = eval(event.data.code);
      window.postMessage({
        type: 'CODE_RESULT',
        result: result
      }, '*');
    } catch (error) {
      window.postMessage({
        type: 'CODE_ERROR',
        error: error.message
      }, '*');
    }
  }
});

// BAD: Dynamic script injection in page context
function injectPageScript(code) {
  const script = document.createElement('script');
  // DANGEROUS: Injecting dynamic code into page
  script.textContent = `(${new Function(code)})();`;
  document.documentElement.appendChild(script);
  script.remove();
}

// BAD: Parsing data with eval
function parseCustomFormat(data) {
  // DANGEROUS: Using eval to parse custom data format
  return eval(`({${data}})`);
}

// BAD: Dynamic regex creation with eval
function createRegexFromString(pattern, flags) {
  // DANGEROUS: Using eval to create regex
  return eval(`/${pattern}/${flags}`);
}

// Listen for extension messages to execute code
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'evalInPage') {
    // DANGEROUS: Evaluating code in page context
    const result = eval(request.code);
    sendResponse({result: result});
  }
});