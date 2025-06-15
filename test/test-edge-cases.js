#!/usr/bin/env node

const ChromeExtensionTestFramework = require('../index');
const path = require('path');
const fs = require('fs');

const EDGE_CASES_DIR = path.join(__dirname, 'scenarios/edge-cases');

async function testEdgeCases() {
    console.log('\n🔍 Testing Edge Cases and Error Handling\n');
    
    const scenarios = fs.readdirSync(EDGE_CASES_DIR)
        .filter(dir => {
            const stat = fs.statSync(path.join(EDGE_CASES_DIR, dir));
            return stat.isDirectory() && dir !== 'README.md';
        });
    
    const results = {
        total: scenarios.length,
        handled: 0,
        crashed: 0,
        details: []
    };
    
    for (const scenario of scenarios) {
        const scenarioPath = path.join(EDGE_CASES_DIR, scenario);
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
            
            // エラーが適切に検出されたかチェック
            if (testResults.summary.failed > 0) {
                console.log(`✅ Errors properly detected: ${testResults.summary.failed} issues found`);
                results.handled++;
                results.details.push({
                    scenario,
                    status: 'handled',
                    errors: testResults.summary.errors.length,
                    message: testResults.summary.errors[0]?.error.message || 'Unknown error'
                });
            } else {
                console.log(`⚠️  No errors detected (unexpected for edge case)`);
                results.details.push({
                    scenario,
                    status: 'missed',
                    errors: 0,
                    message: 'No errors detected'
                });
            }
        } catch (error) {
            console.log(`❌ Framework crashed: ${error.message}`);
            results.crashed++;
            results.details.push({
                scenario,
                status: 'crashed',
                errors: 1,
                message: error.message
            });
        }
    }
    
    // サマリー表示
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('📊 Edge Case Testing Summary');
    console.log('═'.repeat(60));
    console.log(`Total scenarios: ${results.total}`);
    console.log(`Properly handled: ${results.handled} (${Math.round(results.handled/results.total*100)}%)`);
    console.log(`Framework crashes: ${results.crashed} (${Math.round(results.crashed/results.total*100)}%)`);
    console.log(`Missed issues: ${results.total - results.handled - results.crashed}`);
    console.log('═'.repeat(60));
    
    // 詳細表示
    console.log('\nDetailed Results:');
    results.details.forEach(detail => {
        const icon = detail.status === 'handled' ? '✅' : 
                    detail.status === 'crashed' ? '❌' : '⚠️';
        console.log(`${icon} ${detail.scenario}: ${detail.message}`);
    });
    
    // エラーハンドリングの品質評価
    const handlingRate = results.handled / results.total;
    if (handlingRate >= 0.8) {
        console.log('\n🎉 Excellent error handling! Framework is robust.');
    } else if (handlingRate >= 0.6) {
        console.log('\n👍 Good error handling, but room for improvement.');
    } else {
        console.log('\n⚠️  Error handling needs improvement.');
    }
}

// 実行
testEdgeCases().catch(console.error);