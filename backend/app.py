from flask import Flask, jsonify, request
import requests
from flask_cors import CORS
import json
from werkzeug.security import generate_password_hash, check_password_hash
import yfinance as yf

app = Flask(__name__)
CORS(app)

# load users
try:
    with open("users.json") as f:
        users = json.load(f)
except:
    users = {}
        
#  save users helper
def save_users():
    with open("users.json", "w") as f:
        json.dump(users, f, indent=4)

#  test route
@app.route('/')
def home():
    return "Backend is running"

#  NEWS API
@app.route('/news', methods=['GET'])
def get_news():
    query = request.args.get('q', '').strip()

    if not query or query.strip() == "":
    #  trending fallback
        url = f"https://newsapi.org/v2/everything?q=india&language=en&sortBy=publishedAt&pageSize=10&apiKey=eb775b5b07bd41d792ef2b49b47ca6b8"
    else:
        url = f"https://newsapi.org/v2/everything?q={query}&language=en&sortBy=publishedAt&apiKey=eb775b5b07bd41d792ef2b49b47ca6b8"

    response = requests.get(url)
    data = response.json()

    print("API RESPONSE:", data)  #  debug

    articles = []
    for article in data.get("articles", []):
        articles.append({
            "title": article.get("title"),
            "description": article.get("description"),
            "image": article.get("urlToImage"),
            "url": article.get("url")
        })

    return jsonify(articles)

#  SIGNUP
@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    username = data['username']
    password = data['password']

    if username in users:
        return jsonify({"message": "User already exists"})

    users[username] = {
        "password": generate_password_hash(password),
        "interests": []   #  store multiple interests
    }

    save_users()
    return jsonify({"message": "Signup successful"})

#  LOGIN (FIXED)
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data['username']
    password = data['password']

    if username in users and check_password_hash(users[username]["password"], password):
        return jsonify({"message": "Login successful"})

    return jsonify({"message": "Invalid credentials"})

#  SAVE INTEREST
@app.route('/save-interest', methods=['POST'])
def save_interest():
    data = request.json
    username = data.get("username")
    topic = data.get("topic")

    if username not in users:
        return jsonify({"message": "User not found"}), 404

    users[username]["interests"].append(topic)

    save_users()
    return jsonify({"message": "Interest saved"})

#  GET RECOMMENDATION (AI LOGIC)
@app.route('/get-interest', methods=['GET'])
def get_interest():
    username = request.args.get("username")

    if username not in users:
        return jsonify({"topic": "technology"})

    interests = users[username].get("interests", [])

    if not interests:
        return jsonify({"topic": "technology"})

    #  AI logic: most frequent
    count = {}
    for i in interests:
        count[i] = count.get(i, 0) + 1

    top_interest = max(count, key=count.get)  

    return jsonify({"topic": top_interest})


# STOCKS 


if __name__ == '__main__':
    app.run(debug=True)