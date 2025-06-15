# Broken Extension Sample

This sample extension contains various issues that can be automatically fixed:

## Issues:

1. **manifest.json problems:**
   - Uses Manifest V2 instead of V3
   - Version includes invalid characters (beta suffix)
   - Name exceeds 45 character limit
   - Description exceeds 132 character limit
   - Uses deprecated `browser_action` instead of `action`
   - Background script uses deprecated format
   - CSP includes unsafe-eval and unsafe-inline

2. **File naming issues:**
   - `My Script.js` - contains spaces
   - `test@file!.html` - contains special characters

## Testing auto-fix:

```bash
# Preview what would be fixed (dry-run)
cext-test samples/broken-extension --fix-dry-run

# Apply fixes
cext-test samples/broken-extension --fix

# Run tests to verify fixes
cext-test samples/broken-extension
```