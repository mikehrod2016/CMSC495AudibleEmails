// check if user is logged in
async function checkLoginStatus() {
    try {
        // request oauth token from background.js
        const token = await getAuthToken();

        // fetch users gmail profile to check if login was successful
        const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        // return login status and users email
        return { isLoggedIn: true, email: data.emailAddress };
    }
    catch (error) {
        console.error('Auth check error:', error);

        // return false if auth fails
        return { isLoggedIn: false, email: null };
    }
}

// request oauth token from background.js
async function getAuthToken(interactive = false) {
    return new Promise((resolve, reject) => {
        // send message to background.js to request a token
        chrome.runtime.sendMessage({ action: 'getAuthToken', interactive }, (response) => {
            if (response.error) {
                reject(response.error); // reject if error
            }
            else {
                resolve(response.token); // resolve with received token
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // check if on settings page
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');

    // check if on popup page
    const loginStatus = document.getElementById('loginStatus');

    // check login status regardless of page
    const { isLoggedIn, email } = await checkLoginStatus();

    if (loginButton && logoutButton) {  // were on settings page
        if (isLoggedIn) {
            loginButton.textContent = `Logged in as ${email}`;
            logoutButton.style.display = 'block';
        }

        // login handler
        loginButton.addEventListener('click', async () => {
            try {
                const token = await new Promise((resolve, reject) => {
                    chrome.identity.getAuthToken({ interactive: true }, (token) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                            return;
                        }
                        resolve(token);
                    });
                });

                const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();

                loginButton.textContent = `Logged in as ${data.emailAddress}`;
                logoutButton.style.display = 'block';
            } catch (error) {
                console.error('Auth error:', error);
                loginButton.textContent = 'Login Failed - Try Again';
            }
        });

        // logout handler
        logoutButton.addEventListener('click', async () => {
            try {
                chrome.identity.getAuthToken({ interactive: false }, (token) => {
                    chrome.identity.removeCachedAuthToken({ token }, () => {
                        loginButton.textContent = 'Login with Google';
                        logoutButton.style.display = 'none';
                    });
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }

    if (loginStatus) {  // were on popup page
        loginStatus.textContent = isLoggedIn ? `Logged in as ${email}` : 'Not logged in';
    }
});