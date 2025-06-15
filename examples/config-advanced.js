/**
 * Advanced configuration example for Chrome Extension Test Framework
 * This demonstrates the new exclude, warning levels, and profile features
 */

module.exports = {
    // Basic configuration
    extensionPath: '.',
    
    // Exclude patterns - files and directories to skip during testing
    exclude: [
        'test/**',              // All test files
        'tests/**',             // Alternative test directory
        '__tests__/**',         // Jest style test directory
        '**/*.test.js',         // Test files anywhere
        '**/*.spec.js',         // Spec files
        'docs/**',              // Documentation
        'examples/**',          // Example files
        'screenshot/**',        // Screenshots
        'coverage/**',          // Coverage reports
        'dist/**',              // Build output
        'build/**',             // Alternative build directory
        '.github/**',           // GitHub specific files
        '*.md',                 // Markdown files
        'LICENSE',              // License file
        '.eslintrc.*',          // ESLint config
        '.prettierrc.*',        // Prettier config
        'jest.config.*',        // Jest config
        'webpack.config.*',     // Webpack config
        'rollup.config.*',      // Rollup config
        'tsconfig.json',        // TypeScript config
        'package-lock.json',    // Lock file
        'yarn.lock',            // Yarn lock file
        'pnpm-lock.yaml'        // pnpm lock file
    ],
    
    // Advanced exclude patterns with categories
    excludePatterns: {
        // Directories to always exclude
        directories: ['temp', 'tmp', 'cache', '.cache', 'logs'],
        
        // File patterns to exclude
        files: [
            '*.log',
            '*.tmp',
            '*.bak',
            '*.swp',
            '*.swo',
            '~*',               // Backup files
            '.DS_Store',        // macOS
            'Thumbs.db',        // Windows
            'desktop.ini'       // Windows
        ],
        
        // Context-specific exclusions
        byContext: {
            development: [
                '*.dev.js',
                'debug/**',
                'dev-tools/**',
                'mock/**'
            ],
            production: [
                'test/**',
                'tests/**',
                'examples/**',
                'docs/**',
                '*.test.js',
                '*.spec.js',
                '*.mock.js',
                'debug.js'
            ],
            ci: [
                'local-config.js',
                '.env.local',
                '.env.development'
            ]
        }
    },
    
    // Include patterns - if specified, ONLY these files are tested
    // include: ['src/**', 'lib/**', 'manifest.json'],
    
    // Warning level configuration
    warningLevels: {
        // Console logging
        'console-logging': {
            severity: 'warn',
            threshold: 5,      // Warn if more than 5 console.log statements
            excludeFiles: ['debug/**', 'dev-tools/**']
        },
        
        // Excessive console logging
        'excessive-logging': {
            severity: 'error',
            threshold: 20,     // Error if more than 20 console statements
            message: 'Too many console statements. Consider using a proper logging library.'
        },
        
        // innerHTML usage
        'innerHTML-usage': {
            severity: 'error',
            excludeFiles: ['test/**', 'examples/**'],
            message: 'Direct innerHTML usage is a security risk. Use textContent or DOM methods.'
        },
        
        // eval() usage
        'eval-usage': 'error',
        
        // HTTP URLs (should be HTTPS)
        'http-url': {
            severity: 'warn',
            message: 'Consider using HTTPS instead of HTTP'
        },
        
        // Inline scripts
        'inline-script': {
            severity: 'error',
            excludeFiles: ['test/**/*.html', 'examples/**/*.html']
        },
        
        // Debug code
        'debug-code': 'ignore-in-test-files',
        
        // TODO comments
        'todo-comments': {
            severity: 'info',
            threshold: 10,     // Info level if more than 10 TODOs
            message: 'Consider creating issues for TODO items'
        },
        
        // Large files
        'large-file': {
            severity: 'warn',
            threshold: 500000,  // 500KB
            message: 'Large files may impact extension performance'
        },
        
        // Deep nesting
        'deep-nesting': {
            severity: 'warn',
            threshold: 5,       // Warn if nesting deeper than 5 levels
            message: 'Deep nesting makes code hard to read and maintain'
        }
    },
    
    // Known issues - these will be reported but not fail the tests
    knownIssues: [
        {
            file: 'legacy/old-popup.js',
            issue: 'eval-usage',
            reason: 'Legacy code - scheduled for refactoring in v2.0'
        },
        {
            file: 'vendor/*.js',
            issue: 'console-logging',
            reason: 'Third-party library'
        },
        {
            file: 'debug-panel.html',
            issue: 'inline-script',
            reason: 'Debug tool only - not included in production'
        }
    ],
    
    // Test profiles
    profiles: {
        // Custom profiles in addition to built-in ones
        'pre-commit': {
            name: 'Pre-commit Hook',
            description: 'Fast checks for git pre-commit hook',
            suites: ['manifest', 'security'],
            exclude: ['test/**', 'docs/**', 'examples/**'],
            failOnError: true,
            failOnWarning: false,
            output: ['console'],
            warningLevels: {
                'console-logging': 'ignore',
                'todo-comments': 'ignore'
            }
        },
        
        'full-check': {
            name: 'Full Check',
            description: 'Comprehensive check with all features',
            suites: ['all'],
            parallel: true,
            failOnWarning: true,
            output: ['console', 'json', 'html', 'markdown'],
            warningLevels: {
                'console-logging': 'error',
                'innerHTML-usage': 'error',
                'eval-usage': 'error',
                'http-url': 'error'
            }
        }
    },
    
    // Output configuration
    output: {
        format: ['console', 'json', 'html'],
        directory: './test-results',
        filename: 'extension-test-report'
    },
    
    // Validation settings
    validation: {
        manifest: true,
        permissions: true,
        csp: true,
        icons: true,
        locales: true
    },
    
    // Performance thresholds
    performance: {
        maxFileSize: 1048576,        // 1MB per file
        maxTotalSize: 5242880,       // 5MB total
        maxJsFiles: 50,
        maxCssFiles: 20,
        maxImageSize: 524288         // 512KB per image
    },
    
    // Custom rules (advanced usage)
    rules: [
        {
            name: 'no-jquery',
            test: (file, content) => {
                if (file.endsWith('.js') && content.includes('jQuery')) {
                    return {
                        passed: false,
                        message: 'jQuery is not recommended for modern Chrome extensions'
                    };
                }
                return { passed: true };
            }
        },
        {
            name: 'use-strict-mode',
            test: (file, content) => {
                if (file.endsWith('.js') && !content.includes("'use strict'")) {
                    return {
                        passed: false,
                        message: 'JavaScript files should use strict mode'
                    };
                }
                return { passed: true };
            }
        }
    ],
    
    // Execution options
    parallel: false,              // Run tests in parallel
    timeout: 30000,               // 30 seconds timeout
    failOnError: true,            // Exit with error code on test failures
    failOnWarning: false,         // Exit with error code on warnings
    verbose: false,               // Verbose output
    progress: true                // Show progress
};

/**
 * Usage examples:
 * 
 * 1. Use this config file:
 *    cext-test -c config-advanced.js
 * 
 * 2. Use with a specific profile:
 *    cext-test -c config-advanced.js --profile pre-commit
 * 
 * 3. Override exclude patterns:
 *    cext-test -c config-advanced.js --exclude "temp/**,cache/**"
 * 
 * 4. Test only specific files:
 *    cext-test -c config-advanced.js --include "src/**,manifest.json"
 * 
 * 5. Strict mode (fail on warnings):
 *    cext-test -c config-advanced.js --fail-on-warning
 */