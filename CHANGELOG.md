# Changelog

All notable changes to Chrome Extension Test Framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2025-06-15

### Added
- Progress display during test execution
- `--verbose` flag for detailed progress information with progress bars
- `--no-progress` flag to disable progress display
- Real-time test status updates
- Suite completion statistics
- Total execution time display
- ProgressReporter class for managing progress output

### Changed
- TestRunner now integrates with ProgressReporter
- Improved console output formatting
- Better visual feedback during test runs

## [1.0.1] - 2025-06-15

### Added
- npm package publication support
- Improved package.json configuration for npm registry
- .npmignore file for cleaner package distribution
- Updated README with npm installation instructions
- Sample Chrome extensions for testing and demonstration
- CI/CD workflow improvements

### Fixed
- Fixed regex error in LocalizationTestSuite
- Fixed CLI permissions issue in postinstall script
- Fixed test framework to use sample extensions instead of parent directory

### Changed
- Updated version to 1.0.1
- Enhanced documentation for npm users

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

[Unreleased]: https://github.com/ibushimaru/chrome-extension-test-framework/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/ibushimaru/chrome-extension-test-framework/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/ibushimaru/chrome-extension-test-framework/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/ibushimaru/chrome-extension-test-framework/releases/tag/v1.0.0