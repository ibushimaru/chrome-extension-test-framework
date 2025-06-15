# Chrome Extension Test Framework - Error Code Reference

This document provides a comprehensive reference for all error codes used in the Chrome Extension Test Framework. Each error includes a description, common causes, and recommended solutions.

## Table of Contents

- [Validation Errors](#validation-errors)
- [Security Errors](#security-errors)
- [Structure Errors](#structure-errors)
- [Performance Errors](#performance-errors)

---

## Validation Errors

### MISSING_REQUIRED_FIELD
**Description:** A required field is missing from the manifest.json or configuration.

**Common Causes:**
- Forgot to include mandatory fields like `manifest_version`, `name`, or `version`
- Typo in field names
- Incorrect nesting of fields

**Solution:**
- Add the missing field to your manifest.json
- Check the Chrome Extensions documentation for required fields
- Use the examples provided in error messages

### INVALID_FIELD_VALUE
**Description:** A field has an invalid value that doesn't match the expected format or type.

**Common Causes:**
- Wrong data type (e.g., string instead of number)
- Invalid format (e.g., version number format)
- Value outside allowed range

**Solution:**
- Check the expected format in the error message
- Refer to the documentation link provided
- Use the example shown in the error

### INVALID_JSON
**Description:** The JSON file contains syntax errors.

**Common Causes:**
- Missing commas between properties
- Unclosed quotes or brackets
- Trailing commas
- Invalid escape sequences

**Solution:**
- Use a JSON validator to identify the exact issue
- Check the line number mentioned in the error
- Common fixes: add missing commas, remove trailing commas, close all brackets

### INVALID_VERSION_FORMAT
**Description:** The version string doesn't follow the required format.

**Common Causes:**
- Too many dot-separated numbers (max 4)
- Non-numeric characters in version
- Empty version segments

**Solution:**
- Use format: X.Y.Z.W where each part is a number
- Examples: "1.0", "2.1.0", "3.0.0.1"
- Remove any non-numeric characters

---

## Security Errors

### UNSAFE_EVAL
**Description:** Code uses eval() which is prohibited in Chrome extensions.

**Common Causes:**
- Direct use of eval() function
- Using eval() to parse JSON
- Dynamic code generation with eval()

**Solution:**
- Replace eval() with JSON.parse() for JSON data
- Use Function constructor sparingly (also restricted)
- Refactor code to avoid dynamic code execution

### UNSAFE_INNERHTML
**Description:** Direct innerHTML usage detected, potential XSS vulnerability.

**Common Causes:**
- Setting innerHTML with user input
- Using innerHTML for templating
- Not sanitizing HTML content

**Solution:**
- Use textContent for plain text
- Use createElement/appendChild for DOM manipulation
- If HTML is necessary, use a sanitization library like DOMPurify

### EXTERNAL_SCRIPT
**Description:** Extension attempts to load scripts from external sources.

**Common Causes:**
- Script tags with external src attributes
- Loading CDN-hosted libraries
- Third-party script integration

**Solution:**
- Download and include scripts locally
- Add scripts to web_accessible_resources if needed
- Use content scripts with proper CSP

### UNSAFE_CSP_EVAL
**Description:** Content Security Policy allows unsafe-eval.

**Common Causes:**
- Legacy code requiring eval()
- Template engines using eval()
- Copied CSP from old examples

**Solution:**
- Remove 'unsafe-eval' from CSP
- Refactor code to not require eval()
- Use CSP-compliant alternatives

### INSECURE_HTTP
**Description:** Using HTTP instead of HTTPS for resources.

**Common Causes:**
- Hard-coded HTTP URLs
- API endpoints using HTTP
- Loading resources over HTTP

**Solution:**
- Always use HTTPS for external resources
- Update all URLs to use HTTPS
- Only exception: http://localhost for development

### BROAD_PERMISSION
**Description:** Extension requests overly broad permissions.

**Common Causes:**
- Using <all_urls> when specific domains would suffice
- Requesting unnecessary permissions
- Copy-pasting permissions from examples

**Solution:**
- Use specific host patterns instead of wildcards
- Only request permissions you actually need
- Follow the principle of least privilege

### INLINE_EVENT_HANDLER
**Description:** HTML contains inline event handlers like onclick.

**Common Causes:**
- onclick, onload, etc. attributes in HTML
- Legacy code patterns
- Generated HTML with event handlers

**Solution:**
- Use addEventListener in JavaScript files
- Separate HTML structure from behavior
- Move all event handling to external scripts

### UNSAFE_DOCUMENT_WRITE
**Description:** Using document.write() which is blocked by CSP.

**Common Causes:**
- Legacy code using document.write
- Third-party scripts using document.write
- Dynamic content injection

**Solution:**
- Use DOM methods like createElement
- Use innerHTML or insertAdjacentHTML carefully
- Refactor to modern DOM manipulation

### INSECURE_STORAGE
**Description:** Potentially storing sensitive data insecurely.

**Common Causes:**
- Storing passwords in plain text
- Saving API keys in localStorage
- Unencrypted sensitive data

**Solution:**
- Never store sensitive data in plain text
- Use encryption for sensitive data
- Consider using OAuth instead of storing credentials

---

## Structure Errors

### FILE_NOT_FOUND
**Description:** A required or referenced file doesn't exist.

**Common Causes:**
- Typo in file path
- File not created yet
- Wrong directory structure

**Solution:**
- Create the missing file
- Check file paths for typos
- Verify directory structure matches manifest

### INVALID_FILE_LOCATION
**Description:** File is in an unconventional location.

**Common Causes:**
- JavaScript files not in js/ directory
- CSS files not in css/ directory
- Unorganized file structure

**Solution:**
- Move files to recommended directories
- Follow conventional extension structure
- Organize files by type

### DEVELOPMENT_FILE
**Description:** Development files included in production extension.

**Common Causes:**
- node_modules included
- .git directory present
- Build configuration files

**Solution:**
- Exclude development files from extension
- Create proper .gitignore
- Use build process to create clean distribution

### LARGE_FILE
**Description:** File size exceeds recommended limits.

**Common Causes:**
- Unoptimized images
- Large bundled libraries
- Unminified code

**Solution:**
- Optimize images (use WebP, compress PNGs)
- Minify JavaScript and CSS
- Consider code splitting for large files

### INVALID_NAMING
**Description:** File names don't follow conventions.

**Common Causes:**
- Spaces in filenames
- Special characters
- Inconsistent naming style

**Solution:**
- Use hyphens or underscores instead of spaces
- Stick to alphanumeric characters
- Follow consistent naming convention (kebab-case recommended)

---

## Performance Errors

### EXTENSION_TOO_LARGE
**Description:** Total extension size exceeds recommended limit.

**Common Causes:**
- Large unoptimized assets
- Including unnecessary files
- Bundled dependencies

**Solution:**
- Optimize all images
- Minify code
- Remove unused dependencies
- Use dynamic imports for large features

### EXCESSIVE_LOGGING
**Description:** Too many console.log statements in production code.

**Common Causes:**
- Debug logs left in code
- Verbose logging
- No production/debug distinction

**Solution:**
- Remove or conditionally enable logs
- Use debug flag for development
- Configure build to strip console.log

### MEMORY_LEAK
**Description:** Potential memory leak patterns detected.

**Common Causes:**
- Event listeners not removed
- Intervals not cleared
- Circular references
- DOM references retained

**Solution:**
- Always remove event listeners when done
- Clear intervals and timeouts
- Use WeakMap/WeakSet for circular references
- Clean up DOM references

### INEFFICIENT_SELECTOR
**Description:** CSS selectors that may impact performance.

**Common Causes:**
- Universal selectors (*)
- Deep nesting
- Complex selectors

**Solution:**
- Use specific class selectors
- Avoid deep nesting
- Optimize selector specificity

### BLOCKING_OPERATION
**Description:** Synchronous operations that may block the UI.

**Common Causes:**
- Synchronous XHR requests
- Heavy computations on main thread
- Large data processing

**Solution:**
- Use async/await for all operations
- Move heavy work to Web Workers
- Process data in chunks

### INEFFICIENT_STORAGE
**Description:** Inefficient use of Chrome storage APIs.

**Common Causes:**
- Too many individual storage calls
- Not batching operations
- Frequent read/write cycles

**Solution:**
- Batch storage operations
- Implement caching layer
- Reduce storage API calls

### DEBUGGER_STATEMENT
**Description:** debugger statement found in code.

**Common Causes:**
- Forgot to remove debugging code
- Left from development
- Accidental commit

**Solution:**
- Remove all debugger statements
- Use proper debugging tools
- Add linting rules to catch debugger

---

## Best Practices

1. **Always read the full error message** - Our enhanced errors provide specific guidance
2. **Check the documentation links** - Each error includes relevant Chrome Extensions docs
3. **Use the provided examples** - Error messages include code examples for fixes
4. **Follow the suggestions** - Each error includes specific steps to resolve the issue
5. **Pay attention to severity** - Critical errors must be fixed, warnings should be addressed

## Getting Help

If you encounter an error not listed here or need additional assistance:

1. Check the [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/mv3/)
2. Review the error's suggestion and example
3. Search for the error code in the project issues
4. Create a new issue with the error details and your manifest.json