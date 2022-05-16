from flask import Flask
from flask_sock import Sock
from flask_socketio import SocketIO
import json

app = Flask(__name__)
app.config.from_object('config')
socketio = SocketIO(app, async_mode=None)
sock = Sock(app)

@sock.route('/cbws')
def answer(sock):  # put application's code here
    while True:
        # get user input from browser
        request_data = sock.receive()
        print(f'Request received: "{str(request_data)}"')

        try:
            request_data = json.loads(request_data)
        except Exception as e:
            pass #no json!

        if isinstance(request_data, dict) and "message" in request_data:
            user_message = request_data.get("message")
        else:
            user_message = request_data


        ints = {"unknown": 1.00}
        answer = f'Message "{user_message}" received!'

        response_data = {
            "message":  answer,
            "intents": ints,
            "further_data": []
        }

        print(f'Response to send: "{str(response_data)}"')

        # send response to browser
        response_data_str = json.dumps(response_data)
        sock.send(response_data_str)


if __name__ == '__main__':
    socketio.run(app, debug=True)

