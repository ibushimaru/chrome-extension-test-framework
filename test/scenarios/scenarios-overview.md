# Chrome Extension Security Test Scenarios

This directory contains test scenarios for validating Chrome extension security issues. Each scenario demonstrates specific security vulnerabilities that should be detected by the test framework.

## Available Scenarios

### 1. xss-vulnerable
**Description**: Extension vulnerable to Cross-Site Scripting (XSS) attacks

**Key Issues**:
- Inline scripts and event handlers in HTML
- Unsafe use of innerHTML with user input
- Weak Content Security Policy allowing unsafe-inline and unsafe-eval
- No input sanitization

**Expected Detections**: 5 errors, 1 warning

### 2. unsafe-permissions
**Description**: Extension requesting excessive and unnecessary permissions

**Key Issues**:
- Requests dangerous permissions without justification
- Uses `<all_urls>` permission unnecessarily
- Overly broad host permissions
- All resources web accessible to all origins
- Accepts external connections from any website

**Expected Detections**: 5 errors, 3 warnings

### 3. insecure-storage
**Description**: Extension with insecure data storage practices

**Key Issues**:
- Hardcoded API keys and secrets in source code
- Passwords stored in plain text
- Sensitive data in localStorage
- Credit card information stored without encryption
- Exposing secrets through DOM and console

**Expected Detections**: 8 errors, 3 warnings

### 4. eval-usage
**Description**: Extension using dangerous JavaScript execution patterns

**Key Issues**:
- Direct eval() usage with user input
- Function constructor creating dynamic functions
- setTimeout/setInterval with string arguments
- Executing code from external sources
- CSP allowing unsafe-eval

**Expected Detections**: 6 errors, 4 warnings

## Testing with the Framework

Each scenario includes:
- `manifest.json` - Extension manifest with security issues
- `*.js` files - JavaScript code demonstrating vulnerabilities
- `*.html` files - HTML with security problems
- `expected-results.json` - Expected security warnings and errors
- `README.md` - Detailed explanation of the security issues

To test a scenario:
```bash
npm test -- --scenario=xss-vulnerable
```

To test all scenarios:
```bash
npm test -- --all-scenarios
```

## Adding New Scenarios

When creating new security test scenarios:

1. Create a new directory under `/test/scenarios/`
2. Include all necessary extension files
3. Add `expected-results.json` with expected findings
4. Document the security issues in a README.md
5. Update this file with the new scenario

## Security Categories Covered

- **XSS Prevention**: Content Security Policy, innerHTML usage, input sanitization
- **Permission Security**: Principle of least privilege, permission justification
- **Data Protection**: Secure storage, encryption, API key management
- **Code Security**: eval usage, dynamic code execution, safe coding patterns