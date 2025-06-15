# Changelog

All notable changes to Chrome Extension Test Framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.0] - 2025-06-15

### Added
- Watch mode functionality with `--watch` or `-w` flag
- FileWatcher class for intelligent file change detection
- Automatic test re-runs on file changes
- Debouncing to prevent excessive test runs
- Intelligent file type detection
- Watch mode statistics on exit (Ctrl+C)
- Ignore patterns for common non-extension files
- Parallel test execution with `--parallel` flag
- ParallelRunner class for managing worker processes
- Worker thread-based test distribution
- Automatic worker count optimization based on CPU cores
- Worker utilization statistics
- Parallel execution progress reporting
- Event-driven architecture for file watching and parallel execution

### Changed
- CLI now supports --watch and --parallel options
- Enhanced help documentation with new options
- Test execution can now run in sequential or parallel mode
- Improved performance for multi-suite test runs

### Fixed
- Reporter error handling for undefined errors array

## [1.3.0] - 2025-06-15

### Added
- Automatic fix functionality with `--fix` and `--fix-dry-run` flags
- AutoFixer class for programmatic fixing
- Manifest.json auto-fixes:
  - Manifest V2 to V3 migration
  - Invalid version format correction
  - Required field addition
  - Name/description length truncation
  - CSP format conversion and unsafe-eval/unsafe-inline removal
  - browser_action to action conversion
- File name auto-fixes:
  - Space to underscore conversion
  - Special character removal
  - Uppercase to lowercase conversion (except README, LICENSE, CHANGELOG)
- Dry-run mode for previewing fixes
- Verbose output for detailed fix information
- Comprehensive auto-fix test suite
- Broken extension sample for testing

### Changed
- CLI now supports --fix and --fix-dry-run options
- Enhanced help documentation

## [1.2.0] - 2025-06-15

### Added
- Enhanced error messages with detailed information
- Custom error classes (BaseError, ValidationError, SecurityError, StructureError, PerformanceError)
- Error codes system for consistent error identification
- Rich error metadata including:
  - Severity levels (low, medium, high, critical)
  - Contextual details
  - Fix suggestions
  - Code examples
  - Documentation links
- ERROR_CODES.md comprehensive reference
- Error formatting in all reporters
- Test script for enhanced errors demonstration

### Changed
- All test suites now use custom error classes
- TestRunner propagates error metadata
- Reporters display formatted error messages
- Progress reporter shows error details during execution

### Fixed
- CI workflow to exclude Node 14.x from macOS tests (arm64 incompatibility)

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

[Unreleased]: https://github.com/ibushimaru/chrome-extension-test-framework/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/ibushimaru/chrome-extension-test-framework/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/ibushimaru/chrome-extension-test-framework/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/ibushimaru/chrome-extension-test-framework/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/ibushimaru/chrome-extension-test-framework/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/ibushimaru/chrome-extension-test-framework/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/ibushimaru/chrome-extension-test-framework/releases/tag/v1.0.0