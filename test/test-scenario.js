#!/usr/bin/env node

const ChromeExtensionTestFramework = require('../index');
const path = require('path');

async function testScenario(scenarioPath) {
    const config = {
        extensionPath: path.resolve(scenarioPath),
        output: {
            format: ['console'],
            directory: './test/results'
        },
        verbose: true
    };
    
    const framework = new ChromeExtensionTestFramework(config);
    framework.useBuiltinTests();
    
    console.log(`\n🧪 Testing scenario: ${scenarioPath}\n`);
    
    try {
        const results = await framework.run();
        
        if (results.summary.failed > 0) {
            console.log('\n❌ Test failed with errors:');
            results.summary.errors.forEach(error => {
                console.log(`  - ${error.error.message}`);
            });
        } else {
            console.log('\n✅ All tests passed!');
        }
        
        process.exit(results.summary.failed > 0 ? 1 : 0);
    } catch (error) {
        console.error('Error running tests:', error);
        process.exit(1);
    }
}

// Get scenario path from command line
const scenarioPath = process.argv[2];
if (!scenarioPath) {
    console.error('Usage: node test-scenario.js <scenario-path>');
    process.exit(1);
}

testScenario(scenarioPath);