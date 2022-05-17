from asyncio import sleep

from flask import Flask, send_from_directory
from flask_sock import Sock
from flask_socketio import SocketIO
import json
import copy


app = Flask(__name__)
application = app #for wsgi
app.config.from_object('config')
socketio = SocketIO(app, async_mode=None)
sock = Sock(app)

to_hide_keys = ["actions", "actions_data", "intents", "intents_data"]

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
    intentions_data = {}
    user_message = data.get("message")

    if "close" in user_message:
        intentions["close"] = 1.0
    elif "lookup" in user_message:
        intentions["lookup"] = 1.0
    else:
        intentions["unknown"] = 1.0

    intentions = {k: v for k, v in sorted(intentions.items(), key=lambda item: item[1], reverse=True)}
    return intentions, intentions_data


def get_answer(data, intents):
    user_message = data.get("message")
    return f'Message "{user_message}" received!'


def get_actions(data, intents):
    actions = []
    actions_data = {}

    if "lookup" in intents:
        actions.append("lookup")
        actions_data["lookup"] = {}

    return actions, actions_data


def get_events(data, intents):
    events = []
    events_data = {}

    if "close" in intents:
        events.append("close")

    return events, events_data


def get_further_data(data, intents):
    return []

@app.route('/')
def display_chat():
    return f'WebSocket implementation only; Get GUI from <a href="https://minhaskamal.github.io/DownGit/#/home?url=https://github.com/ThomFri/dumb_websocket/tree/master/static&fileName=UNZIPME">GitHub</a>'

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
    intents, intents_data = get_intentions(request_data)
    actions, actions_data = get_actions(request_data, intents)
    events, events_data   = get_events(request_data, intents)
    answer                = get_answer(request_data, intents)
    further_data          = get_further_data(request_data, intents)

    # send response to browser
    response_data = {
        "message": answer,
        "intents": intents,
        "intents_data": intents_data,
        "actions": actions,
        "actions_data": actions_data,
        "events": events,
        "events_data": events_data,
        "further_data": further_data
    }
    perform_actions(sock, response_data)


def lookup(sock):
    #sleep(3) # not working yet!
    data = {
        "message": "I looked it up! ;)",
        "events": [],
        "events_data": {},
        "further_data": []
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

