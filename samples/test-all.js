#!/usr/bin/env node

/**
 * Test all sample extensions
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const samples = [
  'good-extension',
  'bad-extension', 
  'minimal-extension'
];

console.log('🧪 Testing all sample extensions...\n');

async function testExtension(name) {
  return new Promise((resolve, reject) => {
    console.log(`\n📦 Testing ${name}...`);
    console.log('─'.repeat(50));
    
    const extensionPath = path.join(__dirname, name);
    
    // Check if extension exists
    if (!fs.existsSync(extensionPath)) {
      console.error(`❌ Extension not found: ${extensionPath}`);
      resolve(false);
      return;
    }
    
    // Run the test
    const cliPath = path.join(__dirname, '..', 'bin', 'cli.js');
    const test = spawn('node', [cliPath, extensionPath, '-o', 'console']);
    
    test.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    
    test.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    test.on('close', (code) => {
      if (code !== 0 && name === 'good-extension') {
        console.error(`\n❌ Good extension should pass all tests!`);
        resolve(false);
      } else if (code === 0 && name === 'bad-extension') {
        console.error(`\n❌ Bad extension should fail tests!`);
        resolve(false);
      } else {
        console.log(`\n✅ ${name} tested as expected`);
        resolve(true);
      }
    });
  });
}

async function runAllTests() {
  const results = [];
  
  for (const sample of samples) {
    const result = await testExtension(sample);
    results.push({ name: sample, success: result });
  }
  
  // Summary
  console.log('\n\n📊 Test Summary');
  console.log('═'.repeat(50));
  
  results.forEach(({ name, success }) => {
    console.log(`${success ? '✅' : '❌'} ${name}`);
  });
  
  const allPassed = results.every(r => r.success);
  console.log(`\n${allPassed ? '✅ All tests completed as expected!' : '❌ Some tests did not behave as expected!'}`);
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests().catch(console.error);