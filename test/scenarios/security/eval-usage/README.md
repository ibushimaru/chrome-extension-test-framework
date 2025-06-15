# Eval Usage Extension

This extension demonstrates dangerous JavaScript patterns involving dynamic code execution.

## Security Issues

### 1. Direct eval() Usage
- Multiple instances of `eval()` with user input
- Executes arbitrary JavaScript code
- Can access all variables in scope
- Primary vector for code injection attacks

### 2. Function Constructor
- `new Function()` is equivalent to eval
- Creates functions from strings
- Bypasses static code analysis
- Same security risks as eval

### 3. Unsafe CSP Configuration
- Manifest allows 'unsafe-eval' in CSP
- Defeats the purpose of Content Security Policy
- Enables all eval-based attacks

### 4. String-based Timers
- `setTimeout(string)` acts like eval
- `setInterval(string)` acts like eval
- Dynamic code execution with delays
- Hard to track and debug

### 5. Code from External Sources
- Executes code from DOM attributes
- Processes code from postMessage
- Runs code from storage
- No validation or sandboxing

### 6. Dynamic Code Injection
- Injects scripts into page context
- Creates dynamic event handlers
- Modifies page behavior unpredictably

## Attack Scenarios

1. **Code Injection**: Attacker can execute arbitrary JavaScript
2. **Privilege Escalation**: Code runs with extension privileges
3. **Data Theft**: Malicious code can access all extension data
4. **XSS Amplification**: Turns input validation bypasses into code execution
5. **Persistent Attacks**: Malicious code stored and re-executed

## Why eval() is Dangerous

1. **No Static Analysis**: Security tools can't analyze dynamic code
2. **Scope Access**: eval'd code accesses all variables
3. **Performance**: Prevents JavaScript optimization
4. **Debugging**: Makes debugging nearly impossible
5. **Security**: Primary vector for injection attacks

## Safe Alternatives

Instead of eval:
- Use `JSON.parse()` for JSON data
- Use specific parsing libraries
- Use Function methods like `call()` and `apply()`
- Use object property accessors
- Create specific functions for calculations
- Use template literals for string interpolation

## Best Practices Violated

- Never use eval() or Function constructor with user input
- Always validate and sanitize input
- Use strict CSP without 'unsafe-eval'
- Avoid string-based timer functions
- Don't execute code from external sources
- Implement proper sandboxing for dynamic behavior