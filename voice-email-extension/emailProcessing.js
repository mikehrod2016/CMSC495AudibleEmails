//Fetches and replies to emails
const fetchLatestEmail = () => {
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
        if (!data.messages || data.messages.length === 0) {
        alert("No new emails.");
            return;
        }
        const messageId = data.messages[0].id;
        fetchEmailDetails(messageId);
    })
    .catch(error => console.error("Error fetching emails:", error));
    });
};

cont fetchEmailDetails = (messageId) => {
    chrome.storage.local.get("accessToken", (data) => {
        fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
            headers: { Authorization: `Bearer ${data.accessToken}` }
        })
        .then(response => response.json())
        .then(email => {
            const subject = email.payload.headers.find(header => header.name === "Subject").value;
            const from = email.payload.headers.find(header => header.name === "From").value;
            const snippet = email.snippet;

            alert(`From: ${from}\nSubject: ${subject}\nMessage: ${snippet}`);
        })
        .catch(error => console.error("Error fetching email details:", error));
    });
};
            
