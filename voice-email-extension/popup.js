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

    // opens full-page tab
    document.getElementById('openPage').addEventListener('click', function() {
        chrome.tabs.create({
            url: '/settings.html'
        });
    });

    let settingsPageId = null;
    
    document.getElementById("startListening").addEventListener("click", () => {
        if (settingsPageId) {
            chrome.tabs.sendMessagee(settingsPageId, { action: "startListening" });
        }
        else {
            chrome.tabs.create({ url: "/settings.html" }, (tab) => {
                settingsPageId = tab.id;
            });
        }
    });

    document.getElementById("stopSpeaking").addEventListener("click", () => {
        if (settingsPageId) {
            chrome.tabs.sendMessage(settingsPageId, { action: "stopSpeaking" });
        }
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "voiceCommand") {
            document.getElementById("status").textContent = `Heard: ${message.command}`;
        }
    });
});