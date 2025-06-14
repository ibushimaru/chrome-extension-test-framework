# Expected Test Results for Bad Extension

This extension is designed to demonstrate common issues and anti-patterns that the Chrome Extension Test Framework can detect.

## Test Summary

- **Total Tests**: ~25
- **Expected Pass**: ~5
- **Expected Fail**: ~20

## Detailed Issues by Test Suite

### 1. Manifest Validation ❌
- **Invalid version format**: "0.1" should be "0.1.0"
- **Missing icons declaration**: No icons object defined
- **Generic icon path**: "icon.png" without size variants
- **Excessive permissions**: Requests many dangerous permissions
- **No default_locale**: Despite no localization

### 2. Security Validation ❌
- **No CSP defined**: Missing content_security_policy
- **Inline scripts**: Uses onclick handlers and inline <script> tags
- **eval() usage**: Direct eval() call in popup.html
- **HTTP resources**: Loads from insecure HTTP endpoints
- **External scripts**: Loads scripts from CDNs
- **<all_urls> permission**: Overly broad host permissions
- **Password collection**: Content script collects password fields
- **Data exfiltration**: Sends data to external servers

### 3. Performance Validation ❌
- **Large libraries**: Includes jQuery for simple tasks
- **Memory leaks**: Growing array in background script
- **Blocking operations**: Synchronous XMLHttpRequest
- **Inefficient selectors**: Overly broad CSS selectors
- **All frames injection**: Injects into all iframes
- **Heavy web request listeners**: Monitors all web requests

### 4. Structure Validation ❌
- **Development files**: Includes .gitignore, debug.log, TODO.txt
- **Poor organization**: Files in root directory
- **No modular structure**: All code in single files
- **Debug artifacts**: Log files in production

### 5. Localization Validation ❌
- **No localization**: Missing _locales directory
- **Hardcoded strings**: All UI text is hardcoded
- **No i18n support**: No chrome.i18n usage

## Security Vulnerabilities

1. **XSS Risk**: innerHTML with user content
2. **Data Theft**: Collects and sends passwords
3. **Code Injection**: Uses eval() and dynamic script insertion
4. **Insecure Communication**: HTTP instead of HTTPS
5. **Excessive Permissions**: Can access all user data

## Performance Issues

1. **Memory Leak**: Infinite array growth
2. **CPU Waste**: Inefficient DOM operations
3. **Network Overhead**: Monitors all requests
4. **Large Dependencies**: jQuery for simple tasks

This extension serves as a comprehensive example of what NOT to do when developing Chrome extensions.