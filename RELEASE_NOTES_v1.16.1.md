# Chrome Extension Test Framework v1.16.1 Release Notes

## 🎯 Overview

Version 1.16.1 is a critical bug fix release that addresses Issue #59, improving the framework's success rate from 98% to 100% by fixing permission detection false positives in Manifest V3.

## 🐛 Bug Fixes

### Fixed tabs Permission False Positive (Issue #59)
- `chrome.tabs.query` and `chrome.tabs.update` no longer incorrectly require the 'tabs' permission in Manifest V3
- These APIs only need the 'tabs' permission when accessing sensitive properties like URL, title, or favIconUrl
- This fix eliminates the most common false positive that was causing test failures

### Success Rate Improvement
- **Before**: 98% (56/57 tests passing)
- **After**: 100% (57/57 tests passing)
- The "Phantom permissions detection" test now correctly passes for extensions using basic tabs API functionality

## ✨ New Features

### .extensionignore File Support
- Extensions can now include a `.extensionignore` file to specify custom exclusion patterns
- Works similar to `.gitignore` - one pattern per line
- Comments supported with `#` prefix
- Helps exclude project-specific files from security scanning

### Enhanced Default Exclusions
- Added automatic exclusion for non-runtime directories:
  - `design-assets/`
  - `docs/`
  - `documentation/`
  - `mockups/`
  - `wireframes/`
  - `screenshots/`
  - `.github/`
- Common configuration files are now excluded by default:
  - `.extensionignore`
  - `.eslintrc*`
  - `.prettierrc*`
  - `tsconfig.json`
  - `webpack.config.js`
  - `rollup.config.js`
  - `vite.config.js`

## 📊 Impact

This release significantly improves the accuracy of the framework, particularly for Manifest V3 extensions that use the Chrome tabs API. Extensions that were previously failing due to false positive permission detections will now pass correctly.

## 🔄 Upgrade Guide

Simply update to the latest version:
```bash
npm update -g chrome-extension-test-framework
```

No configuration changes are required. The framework will automatically apply the fixes.

## 🙏 Acknowledgments

Special thanks to the AI testing community for reporting Issue #59 and providing detailed feedback on the false positive rates.

## 📝 Changelog

For a complete list of changes, see the [CHANGELOG.md](https://github.com/ibushimaru/chrome-extension-test-framework/blob/main/CHANGELOG.md#1161---2025-06-17)