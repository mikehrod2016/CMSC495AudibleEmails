// TODO: reorganise code and create functions for repeated segments

// get oauth token dynamically
const getAccessToken = () => {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
            action: 'getAuthToken',
            interactive: true
        }, (response) => {
            if (response.error) {
                reject(response.error);
            } else {
                resolve(response.token);
            }
        });
    });
};

let recentEmails = {};

// Fetch the first five email subjects and read them aloud
const fetchFirstFiveEmails = async () => {
    try {
        const token = await getAccessToken();
        const response = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages?q=is:inbox&maxResults=5", {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!data.messages || data.messages.length === 0) {
            alert("No new emails.");
            readTextAloud("There are no new emails.")
            return;
        }

        let emailSubjects = [];
        recentEmails = {};

        let fetchPromises = data.messages.map((message, index) =>
            fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${message.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
                .then(response => response.json())
                .then(email => {
                    let subject = email.payload.headers.find(header => header.name === "Subject")?.value || `Email ${index + 1}`;
                    let from = email.payload.headers.find(header => header.name === "From")?.value || "Unknown Sender";
                    emailSubjects.push(`${index + 1}: ${subject} from ${from}`);
                    recentEmails[index + 1] = {
                        id: message.id,
                        subject,
                        from
                    };
                })
        );

        await Promise.all(fetchPromises);
        // build subject list to output
        let subjectList = emailSubjects.join(". ");
        let readText = `You have five recent emails. ${subjectList}. Say "Read Email Number", followed by the number to hear more.`;
        console.log(readText); // for debug
        window.readTextAloud(readText);

    } catch (error) {
        console.error("Error fetching emails:", error);
        window.readTextAloud("An error occurred while reading the email.");
    }
};

// get email by number and read w/ tts
const readEmailByNumber = async (emailNumber) => {
    const email = recentEmails[emailNumber];
    if (!email) {
        readTextAloud(`I could not find the email number ${emailNumber}. Please try again.`);
        return;
    }

    try {
        const token = await getAccessToken();
        const response = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${email.id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const emailData = await response.json();
        let subject = emailData.payload.headers.find(header => header.name === "Subject")?.value || "No Subject";
        let from = emailData.payload.headers.find(header => header.name === "From")?.value || "Unknown Sender";
        let snippet = emailData.snippet || "No message preview available.";
        let emailText = `Email from ${from}. Subject: ${subject}. Preview: ${snippet}`;
        console.log(emailText);
        readTextAloud(emailText);
    } catch (error) {
        console.error("Error fetching email:", error);
        readTextAloud("An error occurred while fetching the email details.");
    }
};

const deleteEmailByNumber = async (emailNumber) => {
    const email = recentEmails[emailNumber];
    if (!email) {
        readTextAloud(`I could not find the email number ${emailNumber}. Please try again.`);
        return;
    }

    try {
        const token = await getAccessToken();
        const deleteResponse = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${email.id}/trash`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (deleteResponse.ok) {
            const confirmMessage = `The email from ${email.from} with subject "${email.subject}" has been deleted!`;
            console.log(confirmMessage);
            readTextAloud(confirmMessage);
        } else {
            throw new Error("Failed to delete the email.");
        }
    } catch (error) {
        console.error("Error deleting email:", error);
        readTextAloud("There was error while trying to delete the email.")
    }
}

// Delete the latest email from the inbox
const deleteLatestEmail = async () => {
    try {
        const token = await getAccessToken();
        const response = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages?q=is:inbox&maxResults=1", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (!data.messages || data.messages.length === 0) {
            window.readTextAloud("There are no emails to delete.");
            return;
        }

        const latestEmailID = data.messages[0].id;
        const deleteResponse = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${latestEmailID}/trash`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        if (deleteResponse.ok) {
            window.readTextAloud("The latest email has been successfully deleted!");
        } else {
            throw new Error("Failed to delete the email.");
        }
    } catch (error) {
        console.error("Error deleting last email: ", error);
        window.readTextAloud("An error occurred while deleting email.");
    }
}

// Mark the latest email as read
const markEmailAsRead = async () => {
    try {
        const token = await getAccessToken();
        const response = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages?q=is:inbox&maxResults=1", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!data.messages || data.messages.length === 0) {
            window.readTextAloud("There are no emails to mark as read.");
            return;
        }

        const messageId = data.messages[0].id;

        const modifyResponse = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                removeLabelIds: ["UNREAD"]
            })
        });

        if (modifyResponse.ok) {
            window.readTextAloud("The latest email has been successfully marked as read!");
        } else {
            throw new Error("Failed to mark the email as read.");
        }
    } catch (error) {
        console.error("Error marking email as read:", error);
        window.readTextAloud("An error occured while trying to mark the email as read.");
    }
};

// expose functions globally
window.fetchFirstFiveEmails = fetchFirstFiveEmails;
window.readEmailByNumber = readEmailByNumber;
window.deleteLatestEmail = deleteLatestEmail;
window.markEmailAsRead = markEmailAsRead;
window.deleteEmailByNumber = deleteEmailByNumber;