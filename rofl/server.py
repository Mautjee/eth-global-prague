# log_server.py
from flask import Flask, request

app = Flask(__name__)


@app.route("/logs", methods=["POST"])
def receive_log():
    data = request.get_json(silent=True)
    if data is None or "message" not in data:
        return "Bad request\n", 400
    print(f"[REMOTE LOG] {data['message']}")
    return "OK\n", 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5560)
