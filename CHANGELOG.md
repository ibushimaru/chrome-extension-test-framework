# Changelog

All notable changes to Chrome Extension Test Framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2024-06-14

### Added
- Initial release of Chrome Extension Test Framework
- Core testing engine with TestRunner, TestSuite, and TestCase classes
- Built-in test suites:
  - Manifest validation (Manifest V3 compliance)
  - Security validation (CSP, eval detection, XSS prevention)
  - Performance validation (file sizes, memory leaks, optimization)
  - Structure validation (file organization, naming conventions)
  - Localization validation (i18n support, message consistency)
- Multiple report formats:
  - Console output with colored indicators
  - JSON format for programmatic processing
  - HTML format with visual dashboard
  - Markdown format for documentation
- CLI tool with comprehensive options:
  - Test specific directories
  - Choose output formats
  - Select specific test suites
  - Configuration file support
- Programmatic API for integration
- Custom test suite support
- Plugin system for extensibility
- Zero runtime dependencies
- Cross-platform support (Windows, macOS, Linux)
- Node.js version support (v12+)

### Security
- Static analysis only - no code execution
- No external network requests
- Read-only file system access by default

### Performance
- Sub-100ms execution time for typical extensions
- Minimal memory footprint (~50MB)
- No browser dependencies

[Unreleased]: https://github.com/yourusername/chrome-extension-test-framework/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yourusername/chrome-extension-test-framework/releases/tag/v1.0.0