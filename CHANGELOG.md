# Changelog

All notable changes to Chrome Extension Test Framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.9.0] - 2025-06-15

### Added
- **PermissionsAnalyzer**: Detailed permission analysis with specific descriptions
  - Shows exactly which permissions are sensitive and why
  - Provides recommendations for permission usage
  - Categorizes permissions by risk level (high, moderate, low)
- **CodeComplexityAnalyzer**: More accurate code complexity detection
  - Fixed false positives in nested loop detection
  - Analyzes cyclomatic complexity
  - Detects overly long functions
- **Enhanced Profile System**: Meaningful differences between profiles
  - development: Skips certain tests, relaxed rules
  - production: Strict validation, all tests enabled
  - quick: Fast subset of tests for pre-commit hooks
- **--show-config option**: Display current configuration and exclude patterns

### Changed
- ExcludeManager now properly uses extensionPath as base for relative paths
- FileNameValidator and DirectoryAnalyzer now use ExcludeManager for consistency
- Profile system now includes skipTests functionality
- Improved permissions validation with detailed explanations

### Fixed
- Configuration file (.cextrc.json) exclude patterns now work correctly
- Fixed false positives in triple nested loops detection
- Profile functionality now has meaningful differences
- Exclude patterns from config files are properly merged with defaults

## [1.8.0] - 2025-06-15

### Added
- **PerformanceAnalyzer**: Comprehensive performance issue detection
  - Memory leak pattern detection (event listeners, timers, growing arrays)
  - Heavy computation detection (nested loops, expensive algorithms)
  - Excessive DOM manipulation detection
  - Bundle size and optimization analysis
  - CSS performance issue detection
  - Duplicate code detection
- **Enhanced Performance Tests**: Deep integration with PerformanceAnalyzer
  - Memory leak prevention with detailed pattern analysis
  - JavaScript optimization with bundle and computation checks
  - Service worker efficiency analysis
  - Loading time optimization with bundle size checks
  - Animation performance with DOM manipulation detection
- **Performance Test Scenarios**: Real-world performance problem examples
  - memory-leak: Various memory leak patterns
  - heavy-computation: Blocking main thread operations
  - large-bundle: Unnecessarily large JavaScript bundles
  - excessive-dom: Creating excessive DOM elements

### Changed
- PerformanceTestSuite now uses PerformanceAnalyzer for deeper analysis
- Improved detection of performance bottlenecks
- Enhanced error reporting with specific performance issue details

### Fixed
- Regular expression escaping in CSS property detection

## [1.7.0] - 2025-06-15

### Added
- **SecurityAnalyzer**: Advanced security vulnerability detection
  - Detects hardcoded API keys, secrets, tokens, and passwords
  - Identifies insecure storage patterns (localStorage, chrome.storage with sensitive data)
  - Finds dangerous JavaScript patterns (eval, Function constructor, setTimeout with strings)
  - Detects XSS vulnerabilities (innerHTML, outerHTML with user input)
  - Identifies insecure communication patterns (HTTP URLs, unvalidated postMessage)
  - Provides detailed reports with line numbers and severity levels
- **Enhanced Security Tests**: Three new security validation tests
  - Advanced security analysis with comprehensive vulnerability scanning
  - Hardcoded secrets detection with multiple pattern matching
  - Secure data storage validation
- **Security Test Scenarios**: Real-world security vulnerability examples
  - xss-vulnerable: XSS attack vectors demonstration
  - eval-usage: Dangerous JavaScript patterns
  - insecure-storage: Insecure data storage practices
  - unsafe-permissions: Overly broad permissions

### Changed
- SecurityTestSuite now performs deeper security analysis
- Improved detection patterns for various security vulnerabilities
- Enhanced error reporting with more specific security issue details

### Fixed
- Security validation now properly detects chrome.storage misuse
- Improved API key and secret detection patterns

## [1.6.0] - 2025-06-15

### Added
- **FileNameValidator**: Comprehensive file name validation with platform compatibility checks
  - Detects special characters, spaces, and other problematic patterns
  - Platform-specific compatibility checks (Windows, macOS, Linux)
  - Automatic fix suggestions for problematic file names
  - Batch validation for entire directories
- **DirectoryAnalyzer**: Advanced directory structure analysis
  - Measures directory depth and complexity metrics
  - Detects overly deep nesting (configurable threshold)
  - Path length validation for Windows compatibility
  - Identifies directories with too many files
  - Generates structure visualization and improvement suggestions
- **Test Scenarios Framework**: Real-world testing scenarios
  - Edge case scenarios for testing framework improvements
  - Automated scenario runner with expected results comparison
  - Framework improvement suggestions based on test results
- **Enhanced StructureTestSuite**: Improved file structure validation
  - Integrated FileNameValidator for comprehensive naming checks
  - Added directory depth analysis test
  - Better error reporting with severity levels

### Changed
- StructureTestSuite now provides more detailed file naming issue reports
- Improved file organization suggestions based on directory analysis

### Fixed
- Fixed special character detection to exclude file extensions
- Improved error messages for file naming issues

## [1.5.0] - 2025-06-15

### Added
- Exclude patterns functionality with `--exclude` flag
- Include patterns functionality with `--include` flag
- Warning level configuration system
- Profile support with built-in profiles (development, production, ci, quick)
- Custom profile creation capability
- Known issues tracking with reasons
- Context-based exclusions (development/production/ci)
- Incremental testing with `--changed` and `--since-last-run` flags
- Test cache management with `--clear-cache` flag
- Git-based change detection for incremental testing
- Hash-based file change detection
- Time-based change detection
- Automatic test suite selection based on changed files
- ExcludeManager class for advanced pattern matching
- WarningManager class for flexible warning configuration
- ProfileManager class for test profiles
- IncrementalTester class for smart test execution
- Advanced configuration example (examples/config-advanced.js)

### Changed
- CLI now supports exclude/include patterns and profiles
- Test execution can be filtered based on file changes
- Warning severity can be customized per warning type
- Configuration files now support advanced exclude patterns
- Improved test execution efficiency with incremental testing

### Fixed
- Pattern matching for complex glob patterns
- Warning level inheritance in test files

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

[Unreleased]: https://github.com/ibushimaru/chrome-extension-test-framework/compare/v1.8.0...HEAD
[1.8.0]: https://github.com/ibushimaru/chrome-extension-test-framework/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/ibushimaru/chrome-extension-test-framework/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/ibushimaru/chrome-extension-test-framework/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/ibushimaru/chrome-extension-test-framework/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/ibushimaru/chrome-extension-test-framework/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/ibushimaru/chrome-extension-test-framework/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/ibushimaru/chrome-extension-test-framework/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/ibushimaru/chrome-extension-test-framework/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/ibushimaru/chrome-extension-test-framework/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/ibushimaru/chrome-extension-test-framework/releases/tag/v1.0.0