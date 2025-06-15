// Modern popup script using chrome.storage
document.getElementById('test').addEventListener('click', async () => {
    // Use chrome.storage.local instead of localStorage
    const data = await chrome.storage.local.get(['apiKey']);
    console.log('Retrieved data:', data);
    
    // Test chrome.action API
    chrome.action.setBadgeText({ text: 'OK' });
    chrome.action.setBadgeBackgroundColor({ color: '#4688F1' });
});