// html element vars
    var ele_ws_status;
    var ele_ws_url;
    var ele_ws_json;
    var ele_chat_form;
    var ele_chat_field;
    var ele_chat_log;

// ws vars
    var socket;
    var ws_url;

// chat vars
    const chat_ws_prefix =  "WS: ";
    const chat_ws_class = "ws_message";
    const chat_user_prefix = "You: ";
    const chat_user_class = "you_message";


// helper function for sleep
    const sleep = ms => new Promise(res => setTimeout(res, ms));

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
    async function ws_init(){
        while (socket === undefined || socket.readyState === 0 || socket.readyState === 3) {
            socket = new WebSocket(ws_url);
            socket.onopen = function(evt) {
                ele_ws_status.innerHTML = `WS connected`;
                ele_ws_status.style.backgroundColor = 'greenyellow';
            };

            //check if connection is ok
            while(socket.readyState === 0) {
                //waiting for connection ;)
                //console.log("Waiting for WS connection")
                await sleep(500);
            }
        }

        socket.onclose = function(evt) {
            ele_ws_status.innerHTML = `WS closed; reconnecting.. (if unsuccessful, please reload page!)`;
            ele_ws_status.style.backgroundColor = 'red';
            ws_init();
        };
        socket.onerror = function(evt) {
            ele_ws_status.innerHTML = `WS error; reconnecting.. (if unsuccessful, please reload page!)`;
            ele_ws_status.style.backgroundColor = 'red';
            socket.close();
            ws_init();
        };
        // EventListener to check for answer
        socket.onmessage = function(event) {
            handle_message(event);
        };
    }


// function for receiving chat
    function handle_message(event){
        var response_data = event.data;
        try {
            response_data = JSON.parse(response_data);
        }
        catch (e){
            console.log("response_data is not valid json")
        }

        ele_ws_json.innerHTML = event.data;
        var message = "";

        if("message" in response_data) {
            message =  response_data["message"];
        }
        else {
            message =  response_data;
        }

        append_to_chat(chat_ws_prefix + message, chat_ws_class);
    }

// function for submitting user input
    function submit_message(event){
        event.preventDefault();

        // get user input
        var user_input = ele_chat_field.value;
        append_to_chat(chat_user_prefix + user_input, chat_user_class);

        // create request data
        request_data = {
            "message": user_input,
            "other_stuff": null
        };

        // send user input to Socketserver
        var request_data_str = JSON.stringify(request_data);
        socket.send(request_data_str);

        // reset textField to empty value
        ele_chat_field.value = '';
    }

// Append text to chat (with class)
    const append_to_chat = (text, html_class) => {
        ele_chat_log.innerHTML += `<div class="${html_class}">${text}</div>`;
    };


// init everything after page load
    window.onload = function() {
    // get html elements
        ele_ws_status = document.getElementById('ws_status');
        ele_ws_url = document.getElementById('ws_url');
        ele_ws_json = document.getElementById('ws_json');
        ele_chat_form = document.getElementById('chat_form');
        ele_chat_field = document.getElementById('chat_field');
        ele_chat_log = document.getElementById('chat_log');

    // get ws url from url
        ws_url = findGetParameter("ws_url") //'ws://localhost:3000/cbws';
        if(ws_url == null) {
            alert('Please specify ws_url as GET param! (e.g. "chat.html?ws_url=ws://localhost:3000/cbws"');
        }
        ele_ws_url.innerHTML = ws_url;

    // connect ws
        ele_ws_status.innerHTML = `WS is connecting...`;
        ele_ws_status.style.backgroundColor = 'orange';
        ws_init();

    // submit user input
        ele_chat_form.onsubmit = event => {
            submit_message(event);
        };
}