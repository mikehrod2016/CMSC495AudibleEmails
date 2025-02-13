document.addEventListener('DOMContentLoaded', () => {
    // check login status when page loads
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
        const loginStatus = document.getElementById('loginStatus');
        if (chrome.runtime.lastError || !token) {
            loginStatus.textContent = 'Not logged in';
            return;
        }

        // if token exists, get email address
        fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
            headers: { 'Authorisation': `Bearer ${token}` }
        })
            .then(response => response.json())
            .then(data => {
                loginStatus.textContent = `Logged in as ${data.emailAddress}`;
            })
            .catch(error => {
                console.error('Error:', error);
                loginStatus.textContent = 'Error checking login status';
            });
    });

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