document.addEventListener('DOMContentLoaded', async () => {
    const loginStatus = document.getElementById('loginStatus');
    const loginStatusCard = document.getElementById('loginStatusCard');
    const fetchEmailsBtn = document.getElementById('fetchEmails');

    try {
        // request oauth token from background.js
        const token = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'getAuthToken',
                interactive: true
            }, (response) => {
                if (response.error) {
                    reject(response.error); // reject if error
                } else {
                    resolve(response.token); // resolve with received token
                }
            });
        });

        // fetch user profile from gmail api using received token
        const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        // update login status with animation
        loginStatusCard.classList.remove('not-logged-in');
        loginStatusCard.classList.add('logged-in');
        loginStatus.innerHTML = `<strong>Logged in as:</strong> ${data.emailAddress}`;
        fetchEmailsBtn.removeAttribute('disabled');
    } catch (error) {
        console.error('Error:', error);
        loginStatus.innerHTML = '<strong>Not logged in</strong><br><small>Please log in to use voice commands</small>';
        loginStatusCard.classList.add('not-logged-in');
    }

    // controls UI logic
    document.getElementById("fetchEmails").addEventListener("click", fetchFirstFiveEmails);

    // opens full-page tab
    document.getElementById('openPage').addEventListener('click', function() {
        chrome.tabs.create({
            url: '/settings.html'
        });
    });

    // get stored settings page id when popup opens
    chrome.storage.local.get(["settingsPageId", "useIcons"], (data) => {
        if (data.settingsPageId) {
            settingsPageId = data.settingsPageId;
        }
        // apply icon display preference if set
        if (data.useIcons !== undefined) {
            toggleIconDisplay(data.useIcons);
        }
    });

    // store settings page id of settings.html
    let settingsPageId = null;

    function toggleIconDisplay(showIcons) {
        const icons = document.querySelectorAll('.fas');
        icons.forEach(icon => {
            icon.style.display = showIcons ? 'inline-block' : 'none';
        });

        // adjust button padding if icons are hidden
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            if (!showIcons) {
                btn.style.paddingLeft = '8px';
                btn.style.paddingRight = '8px';
            } else {
                btn.style.paddingLeft = '';
                btn.style.paddingRight = '';
            }
        });
    }

    function openSettingsPage() {
        chrome.tabs.query({}, (tabs) => {
            let existingPage = tabs.find(tab => tab.url && tab.url.includes("settings.html"));
            if (existingPage) {
                settingsPageId = existingPage.id;
                chrome.storage.local.set({
                    settingsPageId: settingsPageId
                });

                // send message without activating the tab
                chrome.tabs.sendMessage(settingsPageId, {
                    action: "startListening"
                });
            } else {
                chrome.tabs.create({
                    url: "settings.html"
                }, (tab) => {
                    settingsPageId = tab.id;
                    chrome.storage.local.set({
                        settingsPageId: tab.id
                    });
                });
            }
        });
    }

    document.getElementById("startListening").onclick = function(event) {
        event.preventDefault();
        console.log("Start listening button clicked directly");
        // add listening animation class
        document.querySelector('.voice-controls').classList.add('listening');

        // check if settings.html is already open
        if (settingsPageId) {
            // send message directly without checking if tab exists first
            chrome.tabs.sendMessage(settingsPageId, {
                action: "startListening"
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log("Settings tab not found, opening a new one.");
                    openSettingsPage();
                }
            });
        } else {
            // open new tab if not found
            openSettingsPage();
        }
    }

    const stopSpeakingBtn = document.getElementById("stopSpeaking");
    stopSpeakingBtn.addEventListener("click", () => {
        // remove listening animation class
        document.querySelector('.voice-controls').classList.remove('listening');

        if (settingsPageId) {
            chrome.tabs.sendMessage(settingsPageId, {
                action: "stopSpeaking"
            });
        }
    });

    // listen for messages from settings.html
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "voiceCommand") {
            document.getElementById("status").textContent = `Heard: ${message.command}`;
            document.getElementById("recognisedCommand").textContent = `Last Command: ${message.command}`; // for debugging
            // update UI to indicate active voice recognition
            document.querySelector('.voice-controls').classList.add('listening');
        } else if (message.action === "statusUpdate") {
            document.getElementById("status").textContent = message.status;
        } else if (message.action === "micError") {
            // show error in message display
            document.getElementById("status").innerHTML = '<span style="color: #dc3545;"><i class="fas fa-exclamation-triangle"></i> Microphone access denied</span>';
            document.getElementById("recognisedCommand").textContent = "Please enable microphone access in your browser settings";
        }

        // store settingsPageId if message is coming from settings.html
        if (sender.tab && sender.tab.url.includes("settings.html")) {
            settingsPageId = sender.tab.id;
            chrome.storage.local.set({
                settingsPageId: sender.tab.id
            });
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