# Insecure Storage Extension

This extension demonstrates critical security flaws in data storage practices.

## Security Issues

### 1. Hardcoded Secrets
- API keys, passwords, and tokens hardcoded in source code
- Easily discoverable by inspecting extension files
- Cannot be rotated without updating extension

### 2. Plain Text Password Storage
- User passwords stored without any encryption
- Stored in multiple locations: localStorage, chrome.storage
- Credit card information stored in plain text

### 3. localStorage Misuse
- Sensitive data in localStorage persists after extension removal
- Content script uses web page's localStorage (shared storage)
- No isolation between extension and web page data

### 4. chrome.storage.sync Misuse
- Sensitive data synced across all user's devices
- No encryption before syncing
- Passwords and credit cards in sync storage

### 5. DOM Exposure
- Sensitive data injected into page DOM
- API keys in data attributes
- Secrets injected via script tags

### 6. Console Logging
- Passwords and sensitive data logged to console
- Visible in developer tools
- May be captured by other extensions

### 7. External Message API
- Exposes API keys to any website/extension
- No origin validation
- No authentication required

## Attack Vectors

1. **Extension Inspection**: Anyone can unzip and read hardcoded secrets
2. **localStorage Access**: Web pages can read extension's localStorage data
3. **DOM Scraping**: Malicious scripts can read injected secrets
4. **Console Monitoring**: Other extensions can capture logged data
5. **Message Interception**: Any site can request API keys via messaging

## Best Practices Violated

- Never hardcode secrets in source code
- Always encrypt sensitive data before storage
- Use secure, isolated storage mechanisms
- Never log sensitive information
- Validate message origins
- Minimize data in content scripts
- Don't use web page's localStorage from extensions
- Implement proper key management