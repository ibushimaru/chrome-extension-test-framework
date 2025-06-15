# Chrome Extension Test Framework - Error Codes Reference

This document provides a comprehensive reference for all error codes used in the Chrome Extension Test Framework.

## Error Categories

### ValidationError (High Severity)
Errors related to manifest.json and configuration validation.

| Code | Description | Common Causes | Solution |
|------|-------------|---------------|----------|
| `MISSING_REQUIRED_FIELD` | A required field is missing from manifest.json | Field was not included or misspelled | Add the missing field with appropriate value |
| `INVALID_FORMAT` | Invalid JSON or data format | Syntax errors, missing quotes or commas | Use a JSON validator to fix syntax |
| `INVALID_TYPE` | Wrong data type for a field | String instead of number, etc. | Check documentation for correct type |
| `INVALID_VALUE` | Value doesn't meet requirements | Out of range, invalid enum value | Use accepted values from documentation |
| `INVALID_LENGTH` | String or array length exceeds limits | Name too long, too many items | Shorten or reduce to meet limits |
| `INVALID_PATTERN` | Value doesn't match required pattern | Invalid URL, version format | Follow the specified pattern |
| `INVALID_VERSION` | Invalid manifest or extension version | Wrong version format or manifest version | Use semantic versioning (X.Y.Z) |
| `MISSING_DEPENDENCY` | Required dependency is missing | Related field or file not found | Add the required dependency |
| `CIRCULAR_DEPENDENCY` | Circular reference detected | A depends on B which depends on A | Refactor to remove circular references |
| `DEPRECATED_FIELD` | Using deprecated field or API | Using old Manifest V2 syntax | Update to Manifest V3 syntax |

### SecurityError (Critical Severity)
Security vulnerabilities and risks.

| Code | Description | Risk Level | Mitigation |
|------|-------------|------------|------------|
| `UNSAFE_EVAL` | Use of eval() or similar | Critical | Remove eval(), use JSON.parse() or other safe alternatives |
| `UNSAFE_INLINE_SCRIPT` | Inline JavaScript in HTML | High | Move scripts to external files |
| `UNSAFE_EXTERNAL_SCRIPT` | Loading scripts from external domains | High | Host scripts locally or use trusted CDNs with SRI |
| `MISSING_CSP` | No Content Security Policy defined | High | Add appropriate CSP to manifest.json |
| `WEAK_CSP` | CSP is too permissive | Medium | Tighten CSP rules, remove unsafe-* directives |
| `XSS_VULNERABILITY` | Potential XSS vulnerability | Critical | Sanitize user input, use textContent instead of innerHTML |
| `INJECTION_VULNERABILITY` | Code injection risk | Critical | Validate and sanitize all inputs |
| `INSECURE_COMMUNICATION` | Using HTTP instead of HTTPS | High | Use HTTPS for all external communications |
| `EXCESSIVE_PERMISSIONS` | Too many permissions requested | Medium | Follow principle of least privilege |
| `SENSITIVE_DATA_EXPOSURE` | Hardcoded secrets or API keys | Critical | Use secure storage, environment variables |
| `MISSING_INPUT_VALIDATION` | User input not validated | High | Add input validation and sanitization |
| `INSECURE_STORAGE` | Sensitive data in plain text | High | Encrypt sensitive data before storage |

### StructureError (Medium Severity)
File and directory structure issues.

| Code | Description | Impact | Best Practice |
|------|-------------|--------|---------------|
| `MISSING_REQUIRED_FILE` | Required file not found | Extension may not work | Create the missing file |
| `MISSING_REQUIRED_DIR` | Required directory not found | Features may be broken | Create proper directory structure |
| `INVALID_FILE_NAME` | File naming convention violated | Confusion, platform issues | Use lowercase, hyphens, no spaces |
| `INVALID_DIR_NAME` | Directory naming issue | Platform compatibility | Follow naming conventions |
| `INCORRECT_FILE_LOCATION` | File in wrong directory | File not loaded | Move to correct location |
| `DISORGANIZED_STRUCTURE` | Poor file organization | Maintenance difficulty | Organize by feature/type |
| `DEVELOPMENT_FILES_PRESENT` | Dev files in production | Security risk, bloat | Remove before publishing |
| `MISSING_DOCUMENTATION` | No README or docs | Usage unclear | Add documentation files |
| `DUPLICATE_FILES` | Same file in multiple locations | Confusion, larger size | Remove duplicates |
| `INCONSISTENT_NAMING` | Mixed naming conventions | Maintenance issues | Pick one convention and stick to it |

### PerformanceError (Medium Severity)
Performance and optimization issues.

| Code | Description | Threshold | Optimization |
|------|-------------|-----------|--------------|
| `FILE_SIZE_EXCEEDED` | Single file too large | 4MB | Minify, split, or compress |
| `BUNDLE_SIZE_EXCEEDED` | Total size too large | 10MB | Remove unused code, optimize assets |
| `IMAGE_NOT_OPTIMIZED` | Unoptimized images | >100KB | Compress images, use WebP format |
| `LOADING_TIME_EXCEEDED` | Slow initialization | >3s | Lazy load, defer non-critical code |
| `MEMORY_LEAK_DETECTED` | Potential memory leak | N/A | Remove event listeners, clear references |
| `INEFFICIENT_ALGORITHM` | O(n²) or worse complexity | N/A | Use efficient algorithms and data structures |
| `EXCESSIVE_DOM_MANIPULATION` | Too many DOM operations | >100/s | Batch updates, use DocumentFragment |
| `UNMINIFIED_CODE` | Development code in production | N/A | Minify JavaScript and CSS |
| `MISSING_LAZY_LOADING` | Loading all resources upfront | N/A | Implement lazy loading |
| `RENDER_BLOCKING_RESOURCES` | Blocking initial render | N/A | Async/defer scripts, critical CSS |

## Severity Levels

- **Critical** 🚨: Must fix before publishing. Security risks or complete failure.
- **High** ❗: Should fix. Significant issues that affect functionality.
- **Medium** ⚠️: Recommended to fix. Best practices and optimization.
- **Low** ℹ️: Nice to have. Minor improvements and suggestions.

## Example Error Output

```
❌ ValidationError: Required field "name" is missing from manifest.json
   Error Code: MISSING_REQUIRED_FIELD
   Severity: CRITICAL
   Details:
      missingFields: ["name"]
      totalRequired: 3
   💡 Suggestion: Add the "name" field to your manifest.json file
   Example:
      "name": "My Extension"
   📚 Documentation: https://developer.chrome.com/docs/extensions/mv3/manifest/
```

## Using Error Codes in Custom Tests

```javascript
const { ValidationError } = require('chrome-extension-test-framework/lib/errors');

// In your custom test
if (!manifest.name) {
    throw new ValidationError({
        code: ValidationError.CODES.MISSING_REQUIRED_FIELD,
        message: 'Extension name is required',
        field: 'name',
        severity: 'critical',
        suggestion: 'Add a descriptive name for your extension',
        example: '"name": "My Awesome Extension"',
        documentation: 'https://developer.chrome.com/docs/extensions/mv3/manifest/name/'
    });
}
```

## Contributing

When adding new error codes:
1. Add the code to the appropriate error class
2. Update this documentation
3. Include severity level and helpful information
4. Provide actionable suggestions and examples