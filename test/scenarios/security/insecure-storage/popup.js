// Popup script with insecure storage practices

// Hardcoded sensitive data in JavaScript
const CLIENT_SECRET = 'client_secret_xyz789';
const ENCRYPTION_KEY = 'my-super-secret-key'; // BAD: Hardcoded encryption key

document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const creditCard = document.getElementById('creditCard').value;
  
  // BAD: Storing sensitive data in localStorage (persists even after extension removal)
  localStorage.setItem('user_password', password);
  localStorage.setItem('credit_card', creditCard);
  localStorage.setItem('client_secret', CLIENT_SECRET);
  
  // BAD: Storing in sessionStorage (still accessible to content scripts)
  sessionStorage.setItem('temp_password', password);
  
  // Sending to background script to store in chrome.storage
  chrome.runtime.sendMessage({
    action: 'saveCredentials',
    username: username,
    password: password,
    creditCard: creditCard
  });
  
  // BAD: Logging sensitive data
  console.log('Password saved:', password);
  console.log('Credit card:', creditCard);
});

// Display stored sensitive data (BAD practice)
chrome.storage.local.get(null, (data) => {
  // BAD: Displaying sensitive data in UI
  document.getElementById('savedData').innerHTML = `
    <h3>Stored Data:</h3>
    <p>Password: ${data.password || 'none'}</p>
    <p>API Key: ${data.apiKey || 'none'}</p>
    <p>Token: ${data.authToken || 'none'}</p>
  `;
});

// BAD: Storing API responses with sensitive data
fetch('https://api.example.com/user')
  .then(response => response.json())
  .then(data => {
    // Storing entire response which might contain sensitive data
    localStorage.setItem('user_data', JSON.stringify(data));
    chrome.storage.local.set({fullUserProfile: data});
  });