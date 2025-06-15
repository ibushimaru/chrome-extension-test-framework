# Unsafe Permissions Extension

This extension demonstrates the anti-pattern of requesting excessive permissions that aren't needed for the extension's functionality.

## Security Issues

### 1. Excessive API Permissions
The extension requests numerous powerful permissions including:
- `debugger` - Can attach to browser debugging protocol
- `management` - Can manage other extensions
- `proxy` - Can control proxy settings
- `webRequest` - Can intercept and modify network requests
- `cookies` - Can access all cookies
- `history` - Can access browsing history
- `browsingData` - Can clear user data

Most of these are never used in the code.

### 2. Overly Broad Host Permissions
- Requests `<all_urls>` permission
- Includes all protocols: http, https, file, ftp
- Content script matches all URLs
- No domain restrictions

### 3. Unsafe Web Accessible Resources
- Makes ALL resources (`*`) web accessible
- Allows access from ALL origins (`<all_urls>`)
- Exposes entire extension to web pages

### 4. Unrestricted External Connections
- `externally_connectable` allows messages from any website
- No domain whitelist for external communication

## Actual Functionality vs Permissions

The extension only:
- Stores installation time
- Shows current time in popup
- Logs a message to console

This minimal functionality could work with just `storage` permission and no host permissions.

## Security Risks

1. **Attack Surface**: Every permission increases potential attack vectors
2. **User Trust**: Users may reject extensions with excessive permissions
3. **Privilege Escalation**: Compromised extension has unnecessary capabilities
4. **Data Access**: Can access sensitive user data without need

## Best Practices Violated

- Principle of Least Privilege
- Permission justification
- Narrow scope for content scripts
- Restricted web accessible resources
- Limited external connectivity