document.addEventListener('DOMContentLoaded', async () => {
    // listen for messages from popup.js
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "startListening") {
            window.startVoiceRecognition(); // calls from voiceProcessing.js
        } else if (message.action === "stopSpeaking") {
            window.stopTextToSpeech(); // calls from tts.js
        }
    });

    // load saved settings
    loadSettings();

    // check login status on page load
    await checkLoginStatus();

    // settings event listeners
    document.getElementById('iconsToggle').addEventListener('change', function() {
        const showIcons = this.checked;
        updateIconPreview(showIcons);

        // save setting to storage
        chrome.storage.local.set({
            useIcons: showIcons
        });

        // send message to popup to update its display
        chrome.runtime.sendMessage({
            action: "toggleIcons",
            showIcons: showIcons
        });
    });

    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    document.getElementById('loginButton').addEventListener('click', loginWithGoogle);
    document.getElementById('logoutButton').addEventListener('click', logoutFromGoogle);
});

// check login status
async function checkLoginStatus() {
    const accountStatus = document.getElementById('accountStatus');
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');

    try {
        // request token from background script
        const token = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'getAuthToken',
                interactive: false
            }, (response) => {
                if (response.error) {
                    reject(response.error);
                } else {
                    resolve(response.token);
                }
            });
        });

        // fetch user profile using token
        const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        // update UI with login status
        accountStatus.innerHTML = `Logged in as: <strong>${data.emailAddress}</strong>`;
        loginButton.style.display = 'none';
        logoutButton.style.display = 'inline-block';
    } catch (error) {
        console.error('Error checking login status:', error);
        accountStatus.textContent = 'Not logged in';
        loginButton.style.display = 'inline-block';
        logoutButton.style.display = 'none';
    }
}

function loginWithGoogle() {
    chrome.runtime.sendMessage({
        action: 'getAuthToken',
        interactive: true
    }, async (response) => {
        if (response.error) {
            console.error('Login error:', response.error);
        } else {
            checkLoginStatus();
        }
    });
}

function logoutFromGoogle() {
    chrome.runtime.sendMessage({
        action: 'logout'
    }, () => {
        checkLoginStatus();
    });
}

function loadSettings() {
    chrome.storage.local.get([
        'useIcons',
        'voiceSensitivity',
        'continuousListening',
        'soundNotifications',
        'visualNotifications'
    ], (data) => {
        // set icon toggle
        if (data.useIcons !== undefined) {
            document.getElementById('iconsToggle').checked = data.useIcons;
            updateIconPreview(data.useIcons);
        }

        // set voice sensitivity
        if (data.voiceSensitivity !== undefined) {
            document.getElementById('voiceSensitivity').value = data.voiceSensitivity;
        }

        // set continuous listening mode
        if (data.continuousListening !== undefined) {
            document.getElementById('continuousListening').checked = data.continuousListening;
        }

        // set notification settings
        if (data.soundNotifications !== undefined) {
            document.getElementById('soundNotifications').checked = data.soundNotifications;
        }

        // set visual notifications
        if (data.visualNotifications !== undefined) {
            document.getElementById('visualNotifications').checked = data.visualNotifications;
        }
    });
}

function saveSettings() {
    const settings = {
        useIcons: document.getElementById('iconsToggle').checked,
        voiceSensitivity: document.getElementById('voiceSensitivity').value,
        continuousListening: document.getElementById('continuousListening').checked,
        soundNotifications: document.getElementById('soundNotifications').checked,
        visualNotifications: document.getElementById('visualNotifications').checked
    };

    // save settings to chrome storage
    chrome.storage.local.set(settings, () => {
        // Show save confirmation
        const saveButton = document.getElementById('saveSettings');
        const originalText = saveButton.innerHTML;

        saveButton.innerHTML = '<i class="fas fa-check"></i> Settings Saved';
        saveButton.classList.add('btn-success');
        saveButton.classList.remove('btn-primary');

        // reset button after 2 seconds
        setTimeout(() => {
            saveButton.innerHTML = originalText;
            saveButton.classList.remove('btn-success');
            saveButton.classList.add('btn-primary');
        }, 2000);

        // send message to popup to update its display
        chrome.runtime.sendMessage({
            action: "toggleIcons",
            showIcons: settings.useIcons
        });
    });
}

// update icon preview
function updateIconPreview(showIcons) {
    const previewIcon = document.querySelector('.preview-icon');

    if (showIcons) {
        previewIcon.style.display = 'inline-block';
    } else {
        previewIcon.style.display = 'none';
    }
}