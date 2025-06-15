#!/usr/bin/env node

const ChromeExtensionTestFramework = require('../index');
const path = require('path');
const fs = require('fs');

const I18N_SCENARIOS_DIR = path.join(__dirname, 'scenarios/i18n');

async function testI18nScenarios() {
    console.log('\n🌍 Testing Internationalization (i18n) Scenarios\n');
    
    const scenarios = fs.readdirSync(I18N_SCENARIOS_DIR)
        .filter(dir => {
            const stat = fs.statSync(path.join(I18N_SCENARIOS_DIR, dir));
            return stat.isDirectory() && dir !== 'README.md';
        });
    
    const results = {
        total: scenarios.length,
        passed: 0,
        failed: 0,
        issues: []
    };
    
    for (const scenario of scenarios) {
        const scenarioPath = path.join(I18N_SCENARIOS_DIR, scenario);
        console.log(`\n📁 Testing: ${scenario}`);
        console.log(`${'─'.repeat(50)}`);
        
        const config = {
            extensionPath: scenarioPath,
            output: {
                format: ['console'],
                directory: './test/results'
            },
            verbose: false
        };
        
        const framework = new ChromeExtensionTestFramework(config);
        framework.useBuiltinTests();
        
        try {
            const testResults = await framework.run();
            
            // Localization Validationスイートの結果を確認
            const i18nSuite = testResults.suites.find(s => s.name === 'Localization Validation');
            
            if (i18nSuite) {
                const failedTests = i18nSuite.tests.filter(t => t.status === 'failed');
                
                if (failedTests.length > 0) {
                    console.log(`❌ i18n issues detected: ${failedTests.length} problems`);
                    results.failed++;
                    results.issues.push({
                        scenario,
                        problems: failedTests.map(t => t.name),
                        errorCount: failedTests.length
                    });
                } else {
                    console.log(`✅ All i18n tests passed`);
                    results.passed++;
                }
            }
            
            // 警告メッセージの確認
            if (testResults.warnings && testResults.warnings.length > 0) {
                console.log(`⚠️  Warnings: ${testResults.warnings.length}`);
                testResults.warnings.forEach(w => console.log(`   - ${w}`));
            }
            
        } catch (error) {
            console.log(`❌ Framework error: ${error.message}`);
            results.failed++;
        }
    }
    
    // サマリー表示
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('📊 i18n Testing Summary');
    console.log('═'.repeat(60));
    console.log(`Total scenarios: ${results.total}`);
    console.log(`Passed: ${results.passed} (${Math.round(results.passed/results.total*100)}%)`);
    console.log(`Failed: ${results.failed} (${Math.round(results.failed/results.total*100)}%)`);
    console.log('═'.repeat(60));
    
    // 詳細な問題表示
    if (results.issues.length > 0) {
        console.log('\n🔍 Detected Issues:');
        results.issues.forEach(issue => {
            console.log(`\n${issue.scenario}:`);
            issue.problems.forEach(problem => {
                console.log(`  - ${problem}`);
            });
        });
    }
    
    // 推奨事項
    console.log('\n💡 Recommendations:');
    console.log('1. Ensure all locales have consistent message keys');
    console.log('2. Avoid hardcoded text in HTML/JS files');
    console.log('3. Test with RTL languages if supporting global audience');
    console.log('4. Validate placeholder usage in all locales');
}

// 実行
testI18nScenarios().catch(console.error);