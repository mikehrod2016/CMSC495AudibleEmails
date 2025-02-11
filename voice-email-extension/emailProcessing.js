//Fetches and replies to emails
const fetchEmails = () => {
    chrome.storage.local.get("accessToken", (data) => {
        if (!data.accessToken) {
            alert("Please log in first!");
            return;
    }

    fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send", {
        headers: { Authorization: `Bearer ${data.accessToken}` }
    })
    .then(response => response.json() )
    .then(data => {
        console.log("Emails:", data);
        alert(`Fetched ${data.messages.length} emails!`);
        })
    .catch(error => console.error("Error fetching emails:", error));
    });
};
