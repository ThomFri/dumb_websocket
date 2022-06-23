import os
from asyncio import sleep

from flask import Flask, send_from_directory, send_file, redirect
from flask_sock import Sock
from flask_socketio import SocketIO
import json
import copy
from collections import OrderedDict
from operator import getitem


app = Flask(__name__)
application = app #for wsgi
app.config.from_object('config')
socketio = SocketIO(app, async_mode=None)
sock = Sock(app)

to_hide_keys = ["actions", "intents"]

def convert_json(data, make_json=True):
    was_json = False
    try:
        data = json.loads(data)
        was_json = True
    except Exception as e:
        pass  # no json!

    if not was_json and make_json:
        data = {
            "message": data
        }

    return data, was_json


def get_intentions(data):
    intentions = {}

    message = data.get("message")
    message_type = message.get("type")

    if message_type == "text_message":
        message_text = message.get("text")

        if "hi" in message_text or "hello" in message_text:
            intentions["greeting"] = {"probability": 1.0}
        if "close" in message_text or "bye" in message_text:
            intentions["close"] = {"probability": 1.0}
        elif "lookup" in message_text:
            intentions["lookup"] = {"probability": 1.0}
        elif "audio" in message_text:
            intentions["audio"] = {"probability": 1.0}
        elif "picture" in message_text:
            intentions["picture"] = {"probability": 1.0}
        else:
            intentions["unknown"] = {"probability": 1.0}

    else:
        intentions["not_supported"] = {"probability": 1.0}

    intentions = OrderedDict(sorted(intentions.items(), key = lambda x: getitem(x[1], 'probability')))

    return intentions

def get_message(data, intents):
    if "unknown" in intents or "close" in intents or "lookup" in intents:
        text_message = get_text_answer(data, intents)

        result = {
            "type": "text_message",
            "text": text_message
        }

    elif "picture" in intents:
        picture, img_type = get_picture(data, intents)

        result = {
            "type": "picture",
            "url": picture,
            "file_type": img_type
        }

    elif "audio" in intents:
        audio, audio_type = get_audio(data, intents)

        result = {
            "type": "audio",
            "url": audio,
            "file_type": audio_type
        }

    else:
        result = {
            "type": "unknown"
        }

    return result


def get_text_answer(data, intents):
    user_message = data.get("message").get("text")

    if "greeting" in intents:
        return f'Hi 😊'

    if "close" in intents:
        return f'Ok, bye 😢\nI\'m closing the chat... '

    elif "lookup" in intents:
        return f'Let me look this up... 🧐'

    else:
        return f'Message "{user_message}" received!'


def get_picture(data, intents):
    url = "picture.jpg"
    file_type = 'image/jpeg'

    return url, file_type


def get_audio(data, intents):
    url = "audio.wav"
    file_type = 'audio/wav'

    return url, file_type


def get_binary(path):
    file = send_from_directory("resources", path).response.file
    result = file.read().decode('utf_32')

    return result

def get_actions(data, intents):
    actions = {}

    if "lookup" in intents:
        actions["lookup"] = {}

    return actions


def get_events(data, intents):
    events = {}

    if "close" in intents:
        events["close"] = {}

    return events


def get_further_data(data, intents):
    return {}


@app.route('/resources/<path:path>', methods=['GET'])
def get_resourcs_file(path):
    fullpath = f'resources/{path}'
    return send_file(fullpath)


@sock.route('/cbws')
def receive_input(sock):  # put application's code here
    while True:
        # get input data
        request_data = sock.receive()
        print(f'Request received: "{str(request_data)}"')
        evaluate_input(sock, request_data)


def evaluate_input(sock, request_data):
    # evaluate received data
    request_data, is_json = convert_json(request_data)
    intents               = get_intentions(request_data)
    actions               = get_actions(request_data, intents)
    events                = get_events(request_data, intents)
    message               = get_message(request_data, intents)
    further_data          = get_further_data(request_data, intents)

    # send response to browser
    response_data = {
        "message": message,
        "intents": intents,
        "actions": actions,
        "events": events,
        "further_data": further_data
    }
    perform_actions(sock, response_data)


def lookup(sock):
    #sleep(3) # not working yet!
    data = {
        "message": {
            "type": "text_message",
            "text": "I looked it up! 😉"
        },
        "events": {},
        "intents": {},
        "actions": {},
        "further_data": {}
    }

    send_to_user(sock, data)
    pass


def perform_actions(sock, data):
    if "lookup" in data["actions"]:
        lookup(sock)

    send_to_user(sock, data)


def send_to_user(sock, data):
    data = copy.deepcopy(data) # copy dict to clean it
    for to_hide_key in to_hide_keys:
        try:
            del data[to_hide_key]
        except Exception as e:
            pass # key wasn't present

    print(f'Data to send: "{str(data)}"')
    data_str = json.dumps(data)
    sock.send(data_str)


if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=3000)

