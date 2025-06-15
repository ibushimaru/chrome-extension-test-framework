# XSS Vulnerable Extension

This extension demonstrates common XSS vulnerabilities found in Chrome extensions.

## Security Issues

### 1. Weak Content Security Policy
- The manifest.json includes `'unsafe-inline'` and `'unsafe-eval'` in the CSP
- This allows inline scripts and eval() usage, defeating the purpose of CSP

### 2. Inline Scripts and Event Handlers
- popup.html contains inline `<script>` tags
- Uses inline event handlers like `onclick` and `onkeyup`
- These are blocked by default in Chrome extensions for security

### 3. Unsafe innerHTML Usage
- Multiple instances of using `innerHTML` with unsanitized user input
- Direct insertion of user-controlled content into the DOM
- No sanitization or escaping of HTML entities

### 4. Content Script Vulnerabilities
- Content script accepts messages to insert arbitrary HTML
- Trusts data attributes from the host page
- No validation of incoming data

## Exploitation Scenarios

1. **Stored XSS**: Malicious scripts stored in chrome.storage and executed when loaded
2. **DOM XSS**: URL parameters directly inserted into page without sanitization
3. **Message-based XSS**: Malicious messages can inject scripts via content script

## Best Practices Violated

- Not using textContent or proper DOM methods for user content
- Missing input validation and sanitization
- Overly permissive CSP
- Trusting external data sources without verification