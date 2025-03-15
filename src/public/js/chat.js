const ws = new WebSocket("ws://localhost:3001");

ws.onopen = () => {
    console.log("Connected to WebSocket");
};

ws.onmessage = (event) => {
    const chatBox = document.getElementById("chat-box");
    const msg = document.createElement("p");
    msg.textContent = event.data;
    chatBox.appendChild(msg);
};

function sendMessage() {
    const input = document.getElementById("chat-input");
    if (input.value.trim() !== "") {
        ws.send(input.value);
        input.value = "";
    }
}