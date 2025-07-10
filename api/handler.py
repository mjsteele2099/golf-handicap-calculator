from flask import Flask

app = Flask(__name__)

@app.route("/")
def hello():
    return "Hello from minimal Flask on Vercel!"

def handler(request):
    return app(request.environ, lambda *args: None) 