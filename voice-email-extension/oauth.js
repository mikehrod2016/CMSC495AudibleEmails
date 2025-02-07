//Handles OAuth authentication
const CLIENT_ID = "YOUR_CLIENT_ID.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send";

function authenticateUser() {
    chrome.identity.launchWebAuthFlow(
        {
            url: `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&response_type=token&redirect_uri=urn:ietf:wg:oauth:2.0:oob&scope=${SCOPES}`,
            interactive: true
        },
        (redirectURL) => {
            if (chrome.runtime.lastError || !redirectURL) {
                console.error("OAuth Failed", chrome.runtime.lastError);
                return;
            }
            const token = new URL(redirectURL).hash.split("&")[0].split("=")[1];
            chrome.storage.local.set({ accessToken: token }, () => {
                console.log("OAuth Successful!");
            });
        }
    );
}
