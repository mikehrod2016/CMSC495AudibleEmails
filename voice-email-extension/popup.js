document.addEventListener('DOMContentLoaded', async () => {
    const loginStatus = document.getElementById('loginStatus');
    try {
        // request oauth token from background.js
        const token = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ action: 'getAuthToken', interactive: true }, (response) => {
                if (response.error) {
                    reject(response.error); // reject if error
                }
                else {
                    resolve(response.token); // resolve with received token
                }
            });
        });

        // fetch user profile from gmail api using received token
        const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        loginStatus.textContent = `Logged in as ${data.emailAddress}`;
    }
    catch (error) {
        console.error('Error:', error);
        loginStatus.textContent = 'Not logged in';
    }

    // Controls UI logic
    document.getElementById("fetchEmails").addEventListener("click", fetchFirstFiveEmails);
    document.getElementById("startListening").addEventListener("click", startVoiceRecognition);
    document.getElementById("stopSpeaking").addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: "startListening" });
    });

    // opens full-page tab
    document.getElementById('openPage').addEventListener('click', function() {
        chrome.tabs.create({
            url: '/settings.html'
        });
    });
});