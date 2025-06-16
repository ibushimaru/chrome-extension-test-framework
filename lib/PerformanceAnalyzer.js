/**
 * Performance Analyzer
 * Chrome拡張機能のパフォーマンス問題を検出
 */

const fs = require('fs').promises;
const path = require('path');
const CodeComplexityAnalyzer = require('./CodeComplexityAnalyzer');

class PerformanceAnalyzer {
    constructor(options = {}) {
        this.options = {
            memoryLeakThreshold: options.memoryLeakThreshold || 10, // Increased from 5
            heavyComputationThreshold: options.heavyComputationThreshold || 2000, // Increased from 1000
            domElementThreshold: options.domElementThreshold || 2000, // Increased from 1000
            bundleSizeThreshold: options.bundleSizeThreshold || 1024 * 1024, // 1MB instead of 500KB
            ...options
        };
        
        this.issues = [];
    }

    async analyze(extensionPath) {
        this.issues = [];
        this.extensionPath = extensionPath;
        
        // Find all JavaScript, CSS, and HTML files
        const files = await this.findFiles(extensionPath);
        
        // Analyze each file
        for (const file of files) {
            await this.analyzeFile(file);
        }
        
        // Analyze bundle size
        await this.analyzeBundleSize(files);
        
        return this.issues;
    }

    async findFiles(dir, fileList = []) {
        const files = await fs.readdir(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = await fs.stat(filePath);
            
            if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                await this.findFiles(filePath, fileList);
            } else if (stat.isFile()) {
                const ext = path.extname(file).toLowerCase();
                if (['.js', '.css', '.html'].includes(ext)) {
                    fileList.push(filePath);
                }
            }
        }
        
        return fileList;
    }

    async analyzeFile(filePath) {
        const content = await fs.readFile(filePath, 'utf8');
        const fileName = path.basename(filePath);
        const ext = path.extname(filePath).toLowerCase();
        
        if (ext === '.js') {
            this.detectMemoryLeaks(content, fileName);
            this.detectHeavyComputation(content, fileName);
            this.detectExcessiveDOM(content, fileName);
            this.detectBundleIssues(content, fileName);
            this.detectCodeComplexity(content, fileName);
        } else if (ext === '.css') {
            this.detectCSSPerformanceIssues(content, fileName);
        } else if (ext === '.html') {
            this.detectHTMLPerformanceIssues(content, fileName);
        }
    }

    detectMemoryLeaks(content, fileName) {
        const patterns = [
            {
                pattern: /let\s+\w+\s*=\s*\[\s*\];[\s\S]*?\.push\(/g,
                description: 'Growing array without bounds checking'
            },
            {
                pattern: /addEventListener\s*\([^)]+\)(?![\s\S]*?removeEventListener)/g,
                description: 'Event listener not removed'
            },
            {
                pattern: /setInterval\s*\([^)]+\)(?![\s\S]*?clearInterval)/g,
                description: 'Interval not cleared'
            },
            {
                pattern: /setTimeout\s*\(\s*function\s*\(\)\s*\{[\s\S]*?setTimeout/g,
                description: 'Recursive setTimeout creating closures'
            },
            {
                pattern: /document\.createElement[\s\S]*?appendChild(?![\s\S]*?removeChild)/g,
                description: 'DOM elements created but not cleaned up'
            },
            {
                pattern: /new\s+Array\s*\(\s*\d{4,}\s*\)/g,
                description: 'Large array allocation'
            },
            {
                pattern: /chrome\.storage\.(local|sync)\.get[\s\S]*?\.push\(/g,
                description: 'Storage data growing without limits'
            }
        ];

        patterns.forEach(({ pattern, description }) => {
            const matches = content.match(pattern);
            if (matches && matches.length >= this.options.memoryLeakThreshold) {
                this.issues.push({
                    type: 'memory_leak',
                    severity: 'high',
                    file: fileName,
                    description: description,
                    occurrences: matches.length,
                    matches: matches.slice(0, 3) // Show first 3 examples
                });
            }
        });
    }

    detectHeavyComputation(content, fileName) {
        // Skip minified files
        if (fileName.includes('.min.') || this.isMinified(content)) {
            return;
        }
        
        // Check if it's in a worker file
        if (fileName.includes('worker') || content.includes('self.postMessage')) {
            // Workers are designed for heavy computation
            return;
        }
        
        const patterns = [
            {
                pattern: /for\s*\([^)]*\d{6,}[^)]*\)/g,
                description: 'Loop with very large iteration count'
            },
            {
                pattern: /fibonacci|isPrime|factorial/gi,
                description: 'Potentially expensive recursive algorithm',
                skipIfComment: true
            },
            // Triple nested loops detection moved to CodeComplexityAnalyzer
            {
                pattern: /\.sort\s*\([^)]*\)[\s\S]{0,50}\.sort\s*\(/g,
                description: 'Multiple sort operations'
            },
            {
                pattern: /Math\.(sin|cos|tan|sqrt|log)[\s\S]*?for\s*\(/g,
                description: 'Heavy math operations in loops'
            },
            {
                pattern: /addEventListener\s*\(\s*['"]scroll['"][\s\S]*?for\s*\(/g,
                description: 'Heavy computation in scroll handler'
            },
            {
                pattern: /new\s+Array\s*\(\s*\d{5,}\s*\)\.fill\(/g,
                description: 'Large array operations'
            }
        ];

        patterns.forEach(({ pattern, description }) => {
            const matches = content.match(pattern);
            if (matches) {
                this.issues.push({
                    type: 'heavy_computation',
                    severity: matches.length > 3 ? 'critical' : 'high',
                    file: fileName,
                    description: description,
                    occurrences: matches.length,
                    suggestion: 'Consider using Web Workers or chunking'
                });
            }
        });
    }

    detectExcessiveDOM(content, fileName) {
        const patterns = [
            {
                pattern: /for\s*\([^)]+\)[\s\S]*?createElement/g,
                description: 'Creating DOM elements in loop'
            },
            {
                pattern: /innerHTML\s*\+=|innerHTML\s*=\s*innerHTML\s*\+/g,
                description: 'Inefficient innerHTML concatenation'
            },
            {
                pattern: /document\.querySelectorAll\s*\(\s*['"]\*['"]\s*\)/g,
                description: 'Selecting all elements'
            },
            {
                pattern: /appendChild[\s\S]{0,100}appendChild[\s\S]{0,100}appendChild/g,
                description: 'Multiple DOM insertions without fragment'
            },
            {
                pattern: /\.style\.[a-zA-Z]+\s*=[\s\S]*?\.style\.[a-zA-Z]+\s*=/g,
                description: 'Multiple style changes triggering reflow'
            },
            {
                pattern: /offsetHeight|offsetWidth|clientHeight|clientWidth[\s\S]*?style\./g,
                description: 'Layout thrashing detected'
            }
        ];

        patterns.forEach(({ pattern, description }) => {
            const matches = content.match(pattern);
            if (matches) {
                this.issues.push({
                    type: 'excessive_dom',
                    severity: 'high',
                    file: fileName,
                    description: description,
                    occurrences: matches.length,
                    suggestion: 'Use DocumentFragment or virtual DOM techniques'
                });
            }
        });

        // Check for excessive element creation
        const createElementCount = (content.match(/createElement/g) || []).length;
        if (createElementCount > 100) {
            this.issues.push({
                type: 'excessive_dom',
                severity: 'critical',
                file: fileName,
                description: `Creating ${createElementCount} elements`,
                suggestion: 'Consider pagination or virtual scrolling'
            });
        }
    }

    detectBundleIssues(content, fileName) {
        // Check for bundled libraries
        const libraryPatterns = [
            { name: 'jQuery', pattern: /jQuery|\\$\\.fn|\\$\\.extend/g },
            { name: 'Lodash', pattern: /_\.[a-zA-Z]+\(|lodash/g },
            { name: 'Moment.js', pattern: /moment\(|moment\.[a-zA-Z]+/g },
            { name: 'React', pattern: /React\.createElement|useState|useEffect/g },
            { name: 'Vue', pattern: /new Vue\(|Vue\.component/g }
        ];

        libraryPatterns.forEach(({ name, pattern }) => {
            if (pattern.test(content)) {
                this.issues.push({
                    type: 'large_bundle',
                    severity: 'medium',
                    file: fileName,
                    description: `${name} library detected`,
                    suggestion: 'Consider using native alternatives or tree shaking'
                });
            }
        });

        // Check for duplicate code patterns
        const functionPattern = /function\s+(\w+)\s*\([^)]*\)\s*\{([^}]+)\}/g;
        const functions = new Map();
        let match;
        
        while ((match = functionPattern.exec(content)) !== null) {
            const body = match[2].trim();
            if (functions.has(body)) {
                this.issues.push({
                    type: 'duplicate_code',
                    severity: 'low',
                    file: fileName,
                    description: `Duplicate function implementation: ${match[1]} and ${functions.get(body)}`,
                    suggestion: 'Extract common functionality'
                });
            } else {
                functions.set(body, match[1]);
            }
        }
    }

    detectCSSPerformanceIssues(content, fileName) {
        const issues = [];

        // Universal selector
        if (content.includes('* {')) {
            issues.push('Universal selector (*) affects all elements');
        }

        // Complex selectors
        const complexSelectors = content.match(/([>\s]+[^\s{]+){4,}/g);
        if (complexSelectors) {
            issues.push(`${complexSelectors.length} complex selectors found`);
        }

        // Expensive properties
        const expensiveProps = ['filter:', 'box-shadow:', 'transform:', 'calc\\('];
        expensiveProps.forEach(prop => {
            const count = (content.match(new RegExp(prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
            if (count > 10) {
                issues.push(`Heavy use of ${prop} (${count} times)`);
            }
        });

        // Animation of layout properties
        if (/transition:.*?(width|height|padding|margin|top|left|right|bottom)/i.test(content)) {
            issues.push('Animating layout properties causes reflow');
        }

        if (issues.length > 0) {
            this.issues.push({
                type: 'css_performance',
                severity: 'medium',
                file: fileName,
                description: issues.join('; '),
                suggestion: 'Optimize CSS selectors and avoid expensive properties'
            });
        }
    }

    detectHTMLPerformanceIssues(content, fileName) {
        // Check for too many script tags
        const scriptTags = (content.match(/<script/gi) || []).length;
        if (scriptTags > 5) {
            this.issues.push({
                type: 'bundle_loading',
                severity: 'medium',
                file: fileName,
                description: `${scriptTags} script tags found`,
                suggestion: 'Consider bundling scripts'
            });
        }

        // Check for inline scripts
        const inlineScripts = (content.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [])
            .filter(script => !script.includes('src='));
        if (inlineScripts.length > 0) {
            this.issues.push({
                type: 'inline_resources',
                severity: 'low',
                file: fileName,
                description: `${inlineScripts.length} inline scripts found`,
                suggestion: 'Move scripts to external files'
            });
        }
    }

    detectCodeComplexity(content, fileName) {
        const complexityAnalyzer = new CodeComplexityAnalyzer();
        
        // ネストされたループの検出
        const nestedLoops = complexityAnalyzer.detectNestedLoops(content, fileName);
        nestedLoops.forEach(loop => {
            if (loop.depth >= 3) {
                this.issues.push({
                    type: 'nested_loops',
                    severity: 'high',
                    file: fileName,
                    description: `${loop.depth}-level nested loops detected`,
                    startLine: loop.startLine,
                    loopTypes: loop.types.join(' -> ')
                });
            }
        });
        
        // 循環的複雑度の計算
        const complexity = complexityAnalyzer.calculateCyclomaticComplexity(content);
        if (complexity > 20) {
            this.issues.push({
                type: 'high_complexity',
                severity: 'medium',
                file: fileName,
                description: `High cyclomatic complexity: ${complexity}`,
                recommendation: 'Consider refactoring into smaller functions'
            });
        }
        
        // 長すぎる関数の検出
        const longFunctions = complexityAnalyzer.analyzeFunctionLength(content);
        longFunctions.forEach(func => {
            this.issues.push({
                type: 'long_function',
                severity: 'low',
                file: fileName,
                description: `Function '${func.name}' is ${func.lines} lines long`,
                startLine: func.startLine,
                recommendation: 'Consider breaking into smaller functions'
            });
        });
    }

    async analyzeBundleSize(files) {
        let totalJsSize = 0;
        let totalCssSize = 0;
        const largeFires = [];

        for (const file of files) {
            const stat = await fs.stat(file);
            const ext = path.extname(file).toLowerCase();
            
            if (ext === '.js') {
                totalJsSize += stat.size;
            } else if (ext === '.css') {
                totalCssSize += stat.size;
            }

            if (stat.size > this.options.bundleSizeThreshold) {
                largeFires.push({
                    file: path.basename(file),
                    size: stat.size
                });
            }
        }

        if (totalJsSize > this.options.bundleSizeThreshold * 3) {
            this.issues.push({
                type: 'bundle_size',
                severity: 'high',
                description: `Total JavaScript size: ${(totalJsSize / 1024).toFixed(2)}KB`,
                suggestion: 'Implement code splitting and lazy loading'
            });
        }

        if (largeFires.length > 0) {
            largeFires.forEach(({ file, size }) => {
                this.issues.push({
                    type: 'large_file',
                    severity: 'medium',
                    file: file,
                    description: `File size: ${(size / 1024).toFixed(2)}KB`,
                    suggestion: 'Consider splitting or compressing this file'
                });
            });
        }
    }

    generateReport() {
        const report = {
            summary: {
                total: this.issues.length,
                critical: this.issues.filter(i => i.severity === 'critical').length,
                high: this.issues.filter(i => i.severity === 'high').length,
                medium: this.issues.filter(i => i.severity === 'medium').length,
                low: this.issues.filter(i => i.severity === 'low').length
            },
            issuesByType: {},
            issues: this.issues
        };

        // Group by type
        this.issues.forEach(issue => {
            if (!report.issuesByType[issue.type]) {
                report.issuesByType[issue.type] = [];
            }
            report.issuesByType[issue.type].push(issue);
        });

        return report;
    }
    
    isMinified(content) {
        // Check if the content appears to be minified
        const lines = content.split('\n');
        if (lines.length < 10 && content.length > 1000) {
            // Very few lines but lots of content = likely minified
            return true;
        }
        
        // Check average line length
        const avgLineLength = content.length / lines.length;
        if (avgLineLength > 200) {
            return true;
        }
        
        // Check for typical minified patterns
        if (/[a-zA-Z]\.[a-zA-Z]\.[a-zA-Z]/.test(content)) {
            // Chained single-letter properties (e.g., a.b.c)
            return true;
        }
        
        return false;
    }
}

module.exports = PerformanceAnalyzer;