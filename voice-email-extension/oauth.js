// shared function to check login status
async function checkLoginStatus() {
    try {
        const token = await new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive: false }, (token) => {
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
        return { isLoggedIn: true, email: data.emailAddress };
    } catch (error) {
        console.error('Auth check error:', error);
        return { isLoggedIn: false, email: null };
    }
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