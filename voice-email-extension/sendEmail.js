//Sends emails via Gmail API
const sendEmail = (recipient, subject, message) => {
    chrome.storage.local.get("accessToken", (data) => {
        if (!data.accessToken) {
            alert("Please log in first!");
            return;
        }

        const emailContent = `
            To: ${recipient}
            Subject: ${subject}

            ${message}
        .trim();

        const base64Email = btoa(emailContent).replace(/\+g, '-'.).replace(/\+/g, '-').replace(/\//g, '-');
        
        fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
            method: "POST",
            headers: { 
                Authorization: `Bearer ${data.accessToken}`,
                    "Content-Type: "application/json"
            },
            body: JSON.stringify({ raw: base64Email })    
        })
        .then(response => response.json())
        .then(email => {
           console.log("Email sent!", data);
            alert("Email Sent Successfully!");
        })
        .catch(error => console.error("Error sending email:", error));
    });

