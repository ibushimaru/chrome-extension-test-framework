// Background script with dangerous JavaScript patterns

// BAD: Using eval() to execute dynamic code
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'executeCode') {
    try {
      // DANGEROUS: Direct eval of user input
      const result = eval(request.code);
      sendResponse({result: result});
    } catch (error) {
      sendResponse({error: error.message});
    }
  }
  
  if (request.action === 'calculate') {
    // BAD: Using eval for calculations
    const expression = request.expression;
    const calculated = eval(expression);
    sendResponse({result: calculated});
  }
});

// BAD: Using Function constructor (equivalent to eval)
function createDynamicFunction(code) {
  // DANGEROUS: Function constructor with user input
  const dynamicFunc = new Function('data', code);
  return dynamicFunc;
}

// BAD: Dynamic code execution from storage
chrome.storage.local.get(['customCode'], (result) => {
  if (result.customCode) {
    // DANGEROUS: Executing stored code
    eval(result.customCode);
  }
});

// BAD: Using Function constructor for templates
function processTemplate(template, data) {
  // DANGEROUS: Creating function from template string
  const func = new Function('data', `return \`${template}\`;`);
  return func(data);
}

// BAD: Dynamic script injection
function injectScript(scriptContent) {
  // This won't work in MV3 service worker, but shows the pattern
  const script = `
    (function() {
      ${scriptContent}
    })();
  `;
  eval(script);
}