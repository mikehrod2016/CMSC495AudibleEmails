//Fetches and replies to emails
// Fetch the first five email subjects and read them aloud
const fetchFirstFiveEmails = () => {
    chrome.storage.local.get("accessToken", (data) => {
        if (!data.accessToken) {
            alert("Please log in first!");
            return;
        }

        fetch("https://www.googleapis.com/gmail/v1/users/me/messages?q=is:inbox&maxResults=5", {
            headers: { Authorization: `Bearer ${data.accessToken}` }
        })
        .then(response => response.json())
        .then(data => {
            if (!data.messages || data.messages.length === 0) {
                alert("No new emails.");
                return;
            }

            let emailSubjects = [];
            let emailMap = {};

            let fetchPromises = data.messages.map((message, index) =>
                fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${message.id}`, {
                    headers: { Authorization: `Bearer ${data.accessToken}` }
                })
                .then(response => response.json())
                .then(email => {
                    let subject = email.payload.headers.find(header => header.name === "Subject")?.value || `Email ${index + 1}`;
                    emailSubjects.push(subject);
                    emailMap[subject.toLowerCase()] = email.id;
                })
            );

            Promise.all(fetchPromises).then(() => {
                let subjectList = emailSubjects.map((sub, i) => `${i + 1}: ${sub}`).join(". ");
                let readText = `You have five emails. ${subjectList}. Say the subject to read that email.`;
                readTextAloud(readText);
                window.emailMap = emailMap; // Store mapping for voice selection
            });
        })
        .catch(error => console.error("Error fetching emails:", error));
    });
};

// Fetch and read aloud the selected email
const fetchEmailDetails = (messageId) => {
    chrome.storage.local.get("accessToken", (data) => {
        fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
            headers: { Authorization: `Bearer ${data.accessToken}` }
        })
        .then(response => response.json())
        .then(email => {
            let subject = email.payload.headers.find(header => header.name === "Subject")?.value || "No Subject";
            let from = email.payload.headers.find(header => header.name === "From")?.value || "Unknown Sender";
            let snippet = email.snippet || "No message preview available.";

            let emailText = `Email from ${from}. Subject: ${subject}. Preview: ${snippet}`;
            alert(emailText);
            readTextAloud(emailText);
        })
        .catch(error => console.error("Error fetching email details:", error));
    });
};

// Delete the latest email from the inbox
const deleteLatestEmail = () => {
    chrome.storage.local.get("accessToken", (data) => {
        if (!data.accessToken) {
            alert("Please log in first!");
            return;
        }

        fetch("https://www.googleapis.com/gmail/v1/users/me/messages?q=is:inbox&maxResults=1", {
            headers: { Authorization: `Bearer ${data.accessToken}` }
        })
        .then(response => response.json())
        .then(data => {
            if (!data.messages || data.messages.length === 0) {
                alert("No emails to delete.");
                return;
            }
            let messageId = data.messages[0].id;
            deleteEmailById(messageId);
        })
        .catch(error => console.error("Error fetching latest email:", error));
    });
};

// Send a request to delete the specified email
const deleteEmailById = (messageId) => {
    chrome.storage.local.get("accessToken", (data) => {
        fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`, {
            method: "POST",
            headers: { Authorization: `Bearer ${data.accessToken}` }
        })
        .then(() => {
            alert("Email deleted successfully.");
        })
        .catch(error => console.error("Error deleting email:", error));
    });
};

// Mark the latest email as read
const markEmailAsRead = () => {
    chrome.storage.local.get("accessToken", (data) => {
        if (!data.accessToken) {
            alert("Please log in first!");
            return;
        }

        fetch("https://www.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=1", {
            headers: { Authorization: `Bearer ${data.accessToken}` }
        })
        .then(response => response.json())
        .then(data => {
            if (!data.messages || data.messages.length === 0) {
                alert("No unread emails found.");
                return;
            }
            let messageId = data.messages[0].id;
            modifyEmailLabel(messageId, ["UNREAD"]);
        })
        .catch(error => console.error("Error fetching unread email:", error));
    });
};

// Modify email labels (mark as read/unread)
const modifyEmailLabel = (messageId, labels) => {
    chrome.storage.local.get("accessToken", (data) => {
        fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
            method: "POST",
            headers: { Authorization: `Bearer ${data.accessToken}` },
            body: JSON.stringify({ removeLabelIds: labels })
        })
        .then(() => {
            alert("Email marked as read.");
        })
        .catch(error => console.error("Error modifying email label:", error));
    });
};
