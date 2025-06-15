#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const SCENARIOS_DIR = __dirname;
const CATEGORIES = ['edge-cases', 'security', 'performance', 'i18n', 'compatibility', 'structure', 'use-cases'];

// カラー出力用のANSIコード
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// コマンドライン引数の解析
const args = process.argv.slice(2);
const options = {
    category: null,
    detailedReport: args.includes('--detailed-report'),
    outputJson: args.includes('--json'),
    parallel: args.includes('--parallel')
};

// カテゴリフィルター
const categoryIndex = args.indexOf('--category');
if (categoryIndex !== -1 && args[categoryIndex + 1]) {
    options.category = args[categoryIndex + 1];
}

console.log(`${colors.bright}${colors.blue}🧪 Chrome Extension Test Framework - Scenario Runner${colors.reset}\n`);

// 結果を保存する配列
const results = [];

/**
 * シナリオを実行
 */
async function runScenario(scenarioPath, categoryName, scenarioName) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        // Expected results を読み込む
        let expectedResults = null;
        const expectedPath = path.join(scenarioPath, 'expected-results.json');
        if (fs.existsSync(expectedPath)) {
            expectedResults = JSON.parse(fs.readFileSync(expectedPath, 'utf8'));
        }
        
        console.log(`\n${colors.cyan}📁 Testing: ${categoryName}/${scenarioName}${colors.reset}`);
        if (expectedResults?.description) {
            console.log(`   ${colors.bright}Description:${colors.reset} ${expectedResults.description}`);
        }
        
        // cext-test コマンドを実行
        const child = spawn('node', [
            path.join(__dirname, '../../bin/cli.js'),
            '--no-progress',
            '--output', 'json'
        ], {
            cwd: scenarioPath,
            stdio: ['ignore', 'pipe', 'pipe']
        });
        
        let stdout = '';
        let stderr = '';
        
        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        child.on('close', (code) => {
            const duration = Date.now() - startTime;
            const result = {
                category: categoryName,
                scenario: scenarioName,
                path: scenarioPath,
                exitCode: code,
                duration,
                stdout,
                stderr,
                expectedResults,
                success: code === 0,
                actualResults: null
            };
            
            // JSON出力をパース
            try {
                const jsonMatch = stdout.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    result.actualResults = JSON.parse(jsonMatch[0]);
                }
            } catch (e) {
                // JSON解析エラーは無視
            }
            
            // 結果の表示
            if (result.success) {
                console.log(`   ${colors.green}✅ Passed${colors.reset} (${duration}ms)`);
            } else {
                console.log(`   ${colors.red}❌ Failed${colors.reset} (${duration}ms)`);
            }
            
            // 期待される警告/エラーとの比較
            if (expectedResults && result.actualResults) {
                compareResults(expectedResults, result.actualResults);
            }
            
            results.push(result);
            resolve(result);
        });
    });
}

/**
 * 期待される結果と実際の結果を比較
 */
function compareResults(expected, actual) {
    if (options.detailedReport) {
        console.log(`\n   ${colors.bright}Expected vs Actual:${colors.reset}`);
        
        // 警告の比較
        if (expected.expectedWarnings) {
            console.log(`   ${colors.yellow}Warnings:${colors.reset}`);
            expected.expectedWarnings.forEach(warning => {
                console.log(`     - ${warning.type}: ${warning.message}`);
            });
        }
        
        // エラーの比較
        if (expected.expectedErrors) {
            console.log(`   ${colors.red}Errors:${colors.reset}`);
            expected.expectedErrors.forEach(error => {
                console.log(`     - ${error.type}: ${error.message}`);
            });
        }
        
        // フレームワーク改善点
        if (expected.frameworkImprovements) {
            console.log(`   ${colors.magenta}Framework Improvements:${colors.reset}`);
            expected.frameworkImprovements.forEach(improvement => {
                console.log(`     - ${improvement}`);
            });
        }
    }
}

/**
 * すべてのシナリオを検索して実行
 */
async function runAll() {
    const categoriesToRun = options.category ? [options.category] : CATEGORIES;
    
    for (const category of categoriesToRun) {
        const categoryPath = path.join(SCENARIOS_DIR, category);
        
        if (!fs.existsSync(categoryPath)) {
            continue;
        }
        
        console.log(`\n${colors.bright}${colors.blue}=== ${category.toUpperCase()} ===${colors.reset}`);
        
        const scenarios = fs.readdirSync(categoryPath)
            .filter(file => fs.statSync(path.join(categoryPath, file)).isDirectory());
        
        for (const scenario of scenarios) {
            const scenarioPath = path.join(categoryPath, scenario);
            if (fs.existsSync(path.join(scenarioPath, 'manifest.json'))) {
                await runScenario(scenarioPath, category, scenario);
            }
        }
    }
    
    // サマリーの表示
    displaySummary();
    
    // JSON出力
    if (options.outputJson) {
        const outputPath = path.join(SCENARIOS_DIR, 'scenario-results.json');
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        console.log(`\n${colors.cyan}📄 Results saved to: ${outputPath}${colors.reset}`);
    }
}

/**
 * 結果のサマリーを表示
 */
function displaySummary() {
    const total = results.length;
    const passed = results.filter(r => r.success).length;
    const failed = total - passed;
    
    console.log(`\n${colors.bright}${colors.blue}=== SUMMARY ===${colors.reset}`);
    console.log(`Total scenarios: ${total}`);
    console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
    console.log(`Success rate: ${Math.round((passed / total) * 100)}%`);
    
    // フレームワーク改善点の集計
    const improvements = new Set();
    results.forEach(result => {
        if (result.expectedResults?.frameworkImprovements) {
            result.expectedResults.frameworkImprovements.forEach(imp => improvements.add(imp));
        }
    });
    
    if (improvements.size > 0) {
        console.log(`\n${colors.magenta}${colors.bright}📋 Suggested Framework Improvements:${colors.reset}`);
        Array.from(improvements).forEach((improvement, index) => {
            console.log(`${index + 1}. ${improvement}`);
        });
    }
}

// 実行
runAll().catch(error => {
    console.error(`${colors.red}Error:${colors.reset}`, error);
    process.exit(1);
});