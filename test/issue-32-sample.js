// Issue #32 test sample file - innerHTML at known line numbers

// Test 1: innerHTML at the beginning of file (line 5)
document.getElementById('test1').innerHTML = 'At line 5';

// Some filler content
function doSomething() {
    console.log('Filler function');
}

// Test 2: Multiple innerHTML on same line (line 13)
document.getElementById('test2').innerHTML = 'First'; document.getElementById('test3').innerHTML = 'Second';

// More filler content
const someVariable = 42;
const anotherVariable = 'hello';

// Multiline content before innerHTML
const longString = `
This is a multiline string
that spans multiple lines
and creates some distance`;

// Test 3: innerHTML after multiline content (line 26)
document.getElementById('test4').innerHTML = longString;

// Even more filler to create distance
function anotherFunction() {
    const result = someVariable * 2;
    return result;
}

// Some array operations
const myArray = [1, 2, 3, 4, 5];
const doubled = myArray.map(x => x * 2);

// Object definition
const myObject = {
    property1: 'value1',
    property2: 'value2'
};

// Test 4: innerHTML with variable assignment (line 44)
const content = '<div>Some HTML</div>';
element.innerHTML = content;

// Safe innerHTML patterns that should not be reported
element.innerHTML = ''; // Empty string assignment
element.innerHTML = DOMPurify.sanitize(userInput); // Sanitized
element.innerHTML = chrome.i18n.getMessage('key'); // Chrome i18n

// Test 5: innerHTML in comment (should not be detected)
// element.innerHTML = 'This is in a comment';

/* 
   Multi-line comment with innerHTML
   element.innerHTML = 'Also in comment';
*/

// Test 6: innerHTML in string literal (should not be detected)
const codeString = "element.innerHTML = 'This is in a string';";

// Add more content to push the last test further down
for (let i = 0; i < 10; i++) {
    console.log(i);
}

// Another function
function yetAnotherFunction() {
    return 'something';
}

// Test 7: innerHTML at end of file (line 73)
document.getElementById('test7').innerHTML = 'At end of file';