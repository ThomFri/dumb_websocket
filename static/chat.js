window.onload = function() {
    const ws_url = 'ws://localhost:3000/cbws';
    const chat_form = document.getElementById('chat_form');
    const chat_field = document.getElementById('chat_field');
    const chat_log = document.getElementById('chat_log');

    // init WebSocket
    const socket = new WebSocket(ws_url);
    socket.onopen = function(evt) {
        console.log('WS connected');
    };
    socket.onclose = function(evt) {
        alert("WS closed; please reload page!");
    };
    socket.onerror = function(evt) {
        alert("WS error; please reload page!");
    };

    // EventListener to check for answer
    socket.onmessage = function(evt) {
        var response_data = event.data;
        try {
            response_data = JSON.parse(response_data);
        }
        catch (e){
            console.log("response_data is not valid json")
        }

        var message = "";

        if("message" in response_data) {
            message =  response_data["message"];
        }
        else {
            message =  response_data;
        }

        append_to_chat('CB Message: ' + message, "red");
    };


    // Submit user input
    chat_form.onsubmit = event => {
        event.preventDefault();

        // get user input
        var user_input = chat_field.value;
        append_to_chat('User Input: ' + user_input, "blue");

        // create request data
        request_data = {
            "message": user_input,
            "other_stuff": null
        };

        // send user input to Socketserver
        var request_data_str = JSON.stringify(request_data);
        socket.send(request_data_str);

        // reset textField to empty value
        chat_field.value = '';
    };

    const append_to_chat = (text, color) => {
        chat_log.innerHTML += `<span style="color: ${color}">${text}</span><br>`;
    };
}




