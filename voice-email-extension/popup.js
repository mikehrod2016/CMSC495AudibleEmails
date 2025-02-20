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

    // get stored settings page id when popup opens
    chrome.storage.local.get("settingsPageId"), (data) => {
        if (data.settingsPageId) {
            settingsPageId = data.settingsPageId;
        }
    };

    // store settings page id of settings.html
    let settingsPageId = null;

    chrome.storage.local.get("settingsPageId", (data) => {
        if (data.settingsPageId) {
            settingsPageId = data.settingsPageId;
        }
    });

    function openSettingsPage() {
        chrome.tabs.query({}, (tabs) => {
            let existingPage = tabs.find(tab => tab.url && tab.url.includes("settings.html"));
            if (existingPage) {
                settingsPageId = existingPage.id;
                chrome.storage.local.set({ settingsPageId: settingsTabId });

                // bring tab to focus instead of opening new one
                chrome.tabs.update(settingsPageId, { active: true });
            }
            else {
                chrome.tabs.create({ url: "settings.html" }, (tab) => {
                    settingsPageId = tab.id;
                    chrome.storage.local.set({ settingsPageId: tab.id });
                });
            }
        });
    }

    document.getElementById("startListening").addEventListener("click", () => {
        event.preventDefault();
        // check if settings.html is already open
        if (settingsPageId) {
            // if tab exists, send message to start listening
            chrome.tabs.sendMessage(settingsPageId, { action: "startListening" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log("Settings tab not found, opening a new one.");
                    openSettingsPage();
                }
            });
        } else {
            // open new tab if not found
            openSettingsPage();
        }
    });
    

    document.getElementById("stopSpeaking").addEventListener("click", () => {
        if (settingsPageId) {
            chrome.tabs.sendMessage(settingsPageId, { action: "stopSpeaking" });
        }
    });

    // listen for messages from settings.html
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "voiceCommand") {
            document.getElementById("status").textContent = `Heard: ${message.command}`;
            document.getElementById("recognisedCommand").textContent = `Last Command: ${message.command}`; // for debugging
        }
        else if (message.action === "statusUpdate") {
            document.getElementById("status").textContent = message.status;
        }
        else if (message.action === "micError") {
            // todo: figure out why the hell this is triggering initially
            //       once prompt is closed the voice command is processed as designed
            
            // alert("Microphone access denied. Enable microphone access in your browser settings.");
        }

        // store settingsPageId if message is coming from settings.html
        if (sender.tab && sender.tab.url.includes("settings.html")) {
            settingsPageId = sender.tab.id;
            chrome.storage.local.set({ settingsPageId: sender.tab.id });
        }
    });

    // handle page closure to reset stored page id
    chrome.tabs.onRemoved.addListener((tabId) => {
        if (tabId === settingsPageId) {
            settingsPageId = null;
            chrome.storage.local.remove("settingsPageId");
        }
    });

    window.onblur = () => {
        window.focus();
    };

});