// html element vars
    let ele_ws_status;
    let ele_ws_url;
    let ele_ws_json;
    let ele_ws_events;
    let ele_chat_form;
    let ele_chat_field;
    let ele_chat_log;

// ws vars
    let socket;
    let ws_url;
    let res_url;

// chat vars
    const chat_ws_prefix =  "WS: ";
    const chat_ws_class = "ws_message";
    const chat_user_prefix = "You: ";
    const chat_user_class = "you_message";
    const chat_image_class = "chat_image";
    const chat_audio_class = "chat_audio";
    const chat_bling = "ding.wav";

// debug vars
    const verbose = 1;

// helper function for sleep
    const sleep = ms => new Promise(res => setTimeout(res, ms));

// helper for get param from https://stackoverflow.com/a/5448595
    function findGetParameter(parameterName) {
        let result = null,
            tmp = [];

        location.search
            .substring(1)
            .split("&")
            .forEach(function (item) {
                tmp = item.split("=");
                if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
            });
        return result;
    }

// init everything after page load
    window.onload = async function() {
        // get html elements
        if (verbose > 0) {
            console.log("Getting HTML elements");
        }
        ele_ws_status = document.getElementById('ws_status');
        ele_ws_url = document.getElementById('ws_url');
        ele_res_url = document.getElementById('res_url');
        ele_ws_json = document.getElementById('ws_json');
        ele_ws_events = document.getElementById('ws_events');
        ele_chat_form = document.getElementById('chat_form');
        ele_chat_field = document.getElementById('chat_field');
        ele_chat_log = document.getElementById('chat_log');

        // get ws url from url
        ws_url = findGetParameter("ws_url")
        if (ws_url == null) {
            console.warn("ws_url not defined as GET param!");
            alert('Please specify ws_url as GET param! (e.g. "chat.html?ws_url=ws://localhost:3000/cbws"');
        }
        ele_ws_url.innerHTML = ws_url;

        // get res url from url
        res_url = findGetParameter("res_url")
        if (ws_url == null) {
            console.warn("res_url not defined as GET param!");
            alert('Please specify ws_url as GET param! (e.g. "chat.html? ... &res_url=http://localhost:3000/resources/"');
        }
        ele_res_url.innerHTML = res_url;

        // connect ws
        ele_ws_status.innerHTML = `WS is connecting...`;
        ele_ws_status.style.backgroundColor = 'orange';
        await ws_init();

        // submit user input
        ele_chat_form.onsubmit = event => {
            submit_message(event);
        };
    };

// init WebSocket
    async function ws_init(){
        while (socket === undefined || socket.readyState === 0 || socket.readyState === 3) {
            socket = new WebSocket(ws_url);
            socket.onopen = function() {
                if(verbose>0){console.log("WS connected!");}
                ele_ws_status.innerHTML = `WS connected`;
                ele_ws_status.style.backgroundColor = 'greenyellow';
            };

            //check if connection is ok
            while(socket.readyState === 0) {
                // waiting for connection
                if(verbose>0){console.log("Waiting for WS connection");}
                await sleep(500);
            }
        }

        socket.onclose = function() {
            if(verbose>0){console.warn("WS closed!");}
            ele_ws_status.innerHTML = `WS closed; reconnecting.. (if unsuccessful, please reload page!)`;
            ele_ws_status.style.backgroundColor = 'red';
            ws_init();
        };
        socket.onerror = function() {
            if(verbose>0){console.warn("WS error!");}
            ele_ws_status.innerHTML = `WS error; reconnecting.. (if unsuccessful, please reload page!)`;
            ele_ws_status.style.backgroundColor = 'red';
            socket.close();
            ws_init();
        };
        // EventListener to check for answer
        socket.onmessage = function(event) {
            if(verbose>1){console.log("WS received string:");console.log(event.data);}
            handle_message(event);
        };
    }

// function for receiving chat
    function handle_message(event){
        let response_data = event.data;
        try {
            response_data = JSON.parse(response_data);
        }
        catch (e){
            console.warn("response_data is not valid json!")
        }
        if(verbose>0){console.log("WS received message:");console.log(response_data);}

        ele_ws_json.innerHTML = event.data;
        ele_ws_events.innerHTML = JSON.stringify(response_data["events"]);
        
        let message;

        if("message" in response_data) {
            message =  response_data["message"];
        }
        else {
            message =  response_data;
        }

        new Audio(chat_bling).play();

        append_to_chat(chat_ws_prefix, message, chat_ws_class);

        // Wenn als Event close zurückgegeben wird, wird das Chatfenster geschlossen
        if(response_data["events"].close){toggleChat()}
    }

// function for submitting user input
    function submit_message(event){
        event.preventDefault();

        // get user input
        let user_input = {
            "type": "text_message",
            "text": ele_chat_field.value
        };
        append_to_chat(chat_user_prefix, user_input, chat_user_class);

        // create request data
        let request_data = {
            "message": user_input,
            "other_stuff": null
        };

        // send user input to Socketserver
        if(verbose>0){console.log("Sending message to WS:");console.log(JSON.stringify(request_data));}
        let request_data_str = JSON.stringify(request_data);
        if(verbose>1){console.log("Sending string to WS:");console.log(request_data_str);}
        socket.send(request_data_str);

        // reset textField to empty value
        ele_chat_field.value = '';
    }

// Append text to chat (with class)
    const append_to_chat = (prefix, message, html_class) => {
        let message_type = message["type"]

        if(message_type === "text_message") {
            let text = message["text"].replace(/(?:\r\n|\r|\n)/g, '<br>');
            html = `${text}`;
        }
        else if(message_type === "audio") {
            let file_sub_url = message["url"];
            let file_type = message["file_type"];
            let audio_ele = `<audio controls class="${chat_audio_class}">
                        <source src="${res_url}${file_sub_url}" type="${file_type}">
                        Your browser does not support the audio element.
                     </audio>`;
            html = `${audio_ele}`;
        }
        else if(message_type === "picture") {
            let file_sub_url = message["url"];
            let picture_ele = `
            <a href="${res_url}${file_sub_url}"  target="_blank">
                <image class="${chat_image_class} is-clickable" src="${res_url}${file_sub_url}">
            <a/>
            `;
            html = `${picture_ele}`
        }
        else {
            html = `unsupported message of type "${message_type}"`;
        }

        ele_chat_log.innerHTML += 
        `<div class="${html_class}">
            <article class="message ${getColor(prefix)}">
                <div class="message-body">
                    ${html}
                </div>
            </article>
        </div>`;
    };

// Toggles visibility off chat and chat_button

    function toggleChat() {
        var chat = document.getElementById("chat_card");
        var chat_button = document.getElementById("chat_button");
        
        if (chat.style.display === "none") {
            chat.style.display = "block";
            chat_button.style.display = "none";
        } else {
            let message = {type: 'text_message', text: 'You have closed the chat.'};
            append_to_chat( '', message , '');
            chat.style.display = "none";
            chat_button.style.display = "block";        
        }
    } 

    // Deletes chat content
    function deleteChat(){
        document.querySelector("#chat_log").innerHTML = "";
        toggleChat();
        // let delete_request = 
        //     {
        //         "message": {},
        //         "other_stuff": {
        //                     "event": "delete_chat"
        //         }
        //     };
        // if(verbose>0){console.log("Sending delete request to WS:");console.log(JSON.stringify(delete_request));}
        // socket.send(JSON.stringify(delete_request));
    }

    function getColor(prefix){
        switch (prefix){
            case 'WS: ': return 'is-info'
            case 'You: ': return 'is-warning'
            default: return ''
        }
    }