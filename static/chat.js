window.onload = function() {
    const ws_url = findGetParameter("ws_url") //'ws://localhost:3000/cbws';
    const chat_form = document.getElementById('chat_form');
    const chat_field = document.getElementById('chat_field');
    const chat_log = document.getElementById('chat_log');

    const ws_prefix =  "WS: ";
    const ws_class = "ws_message";
    const user_prefix = "You: ";
    const user_class = "you_message";

    // helper for get param from https://stackoverflow.com/a/5448595
    function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
          tmp = item.split("=");
          if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

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

        append_to_chat(ws_prefix + message, ws_class);
    };


    // Submit user input
    chat_form.onsubmit = event => {
        event.preventDefault();

        // get user input
        var user_input = chat_field.value;
        append_to_chat(user_prefix + user_input, user_class);

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

    // Append text to chat (with class)
    const append_to_chat = (text, html_class) => {
        chat_log.innerHTML += `<div class="${html_class}">${text}</div>`;
    };
}




