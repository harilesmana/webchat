const wsUrl = window.location.origin.replace("http", "ws") + "/ws";
const ws = new WebSocket(wsUrl);

ws.onopen = () => console.log("✅ Connected to WebSocket!");
ws.onerror = (error) => console.error("❌ WebSocket Error:", error);

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);

    if (data.action === "load") {
        data.messages.forEach(msg => displayMessage(msg));
    } else if (data.action === "edit") {
        const messageText = document.getElementById(`text-${data.id}`);
        if (messageText) messageText.innerText = data.message;
    } else if (data.action === "delete") {
        document.getElementById(`msg-${data.id}`)?.remove();
    } else {
        displayMessage(data);
    }
};

function sendMessage() {
    const input = document.getElementById("chat-input");
    if (input.value.trim() !== "") {
        ws.send(JSON.stringify({
            id: Date.now().toString(),
            username: username,
            message: input.value
        }));
        input.value = "";
    }
}

function displayMessage(data) {
    const chatBox = document.getElementById("chat-box");
    let msgContainer = document.getElementById(`msg-${data.id}`);

    if (!msgContainer) {
        msgContainer = document.createElement("div");
        msgContainer.setAttribute("id", `msg-${data.id}`);
        msgContainer.innerHTML = `
            <p><strong>${data.username}:</strong> <span id="text-${data.id}">${data.message}</span></p>
            ${data.username === username ? `
                <button onclick="editMessage('${data.id}')">Edit</button>
                <button onclick="deleteMessage('${data.id}')">Delete</button>
            ` : ""}
        `;
        chatBox.appendChild(msgContainer);
    } else {
        document.getElementById(`text-${data.id}`).innerText = data.message;
    }
}

function editMessage(id) {
    const messageText = document.getElementById(`text-${id}`).innerText;
    const newText = prompt("Edit message:", messageText);
    if (newText !== null) {
        ws.send(JSON.stringify({ action: "edit", id, message: newText, username: username }));
    }
}

function deleteMessage(id) {
    if (confirm("Are you sure you want to delete this message?")) {
        ws.send(JSON.stringify({ action: "delete", id, username: username }));
    }
}