from flask import Flask, request, jsonify
import mysql.connector
from dotenv import load_dotenv
import os
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, JWTManager
from flask_jwt_extended import get_jwt_identity
from db import db, cursor
# from request_routes import request_routes

load_dotenv()

app = Flask(__name__)
DB_HOST = os.getenv('DB_HOST')
DB_USER = os.getenv('DB_USER')
DB_PASS = os.getenv('DB_PASS')
DB_NAME = os.getenv('DB_NAME')

db = mysql.connector.connect(
    host=DB_HOST,
    user=DB_USER,
    password=DB_PASS,
    database=DB_NAME
)
cursor = db.cursor()
CORS(app)  # Allow frontend requests

# JWT Configuration
app.config["JWT_SECRET_KEY"] = "your_secret_key"
jwt = JWTManager(app)

bcrypt = Bcrypt(app)

# app.register_blueprint(request_routes)

@app.route('/')
def home():
    return "Flask Backend is Running!"

# User Registration
@app.route('/register', methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "student")  # Default role is 'student'

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password required"}), 400

    # Check if user already exists
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    if cursor.fetchone():
        return jsonify({"success": False, "message": "User already exists"}), 400

    # Hash password and store
    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")
    cursor.execute("INSERT INTO users (email, password_hash, role) VALUES (%s, %s, %s)", (email, hashed_password, role))
    db.commit()

    # Generate token
    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    user_id = cursor.fetchone()[0]
    token = create_access_token(identity=user_id)

    return jsonify({"success": True, "message": "User registered successfully!", "token": token, "role": role}), 201

#login route
@app.route('/login', methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password required"}), 400

    # Fetch user
    cursor.execute("SELECT id, password_hash, role FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()

    if user is None:
        return jsonify({"success": False, "message": "User not found"}), 401

    user_id, stored_hashed_password, role = user  # Unpacking the tuple

    if bcrypt.check_password_hash(stored_hashed_password, password):
        token = create_access_token(identity=user_id)

        # Determine redirect URL based on role
        if role == "faculty":
            redirect_url = "http://127.0.0.1:5000/api/faculty/requests"
        else:
            redirect_url = "http://127.0.0.1:5000/api/submit_request"

        return jsonify({"success": True, "token": token, "role": role, "redirect_url": redirect_url}), 200

    return jsonify({"success": False, "message": "Invalid credentials"}), 401

#upload route
@app.route('/upload', methods=['POST'])
def upload_file():
    file = request.files['file']
    file.save(f'./uploads/{file.filename}')
    
    # Store file details in the database
    query = "INSERT INTO documents (filename, uploaded_by, status) VALUES (%s, %s, %s)"
    cursor.execute(query, (file.filename, 1, 'Pending'))  # Example: uploaded_by = 1 (dummy user)
    db.commit()

    return {"message": "File uploaded successfully!"}


# ======================= Faculty Request Routes =======================

@app.route("/api/faculty/requests", methods=["GET"])
def get_faculty_requests():
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"message": "Token is missing"}), 401
    
    user_id = verify_token(token)  # Assuming a function to verify token and extract user ID
    if not user_id:
        return jsonify({"message": "Invalid token"}), 401

    # Check if the user is a faculty member
    cursor.execute("SELECT id FROM users WHERE id = %s AND role = 'faculty'", (user_id,))
    faculty = cursor.fetchone()
    if not faculty:
        return jsonify({"message": "Unauthorized access"}), 403

    # Fetch pending requests for this faculty
    cursor.execute("SELECT id, student_id, document_url FROM requests WHERE faculty_id = %s AND status = 'pending'", (user_id,))
    requests = cursor.fetchall()

    return jsonify({"requests": requests}), 200


@app.route('/api/faculty/respond', methods=["POST"])
@jwt_required()
def respond_to_request():
    current_user = get_jwt_identity()

    # Ensure only faculty can respond to requests
    if current_user["role"] != "faculty":
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    data = request.get_json()
    request_id = data.get("request_id")
    action = data.get("action")

    if action not in ["approved", "rejected"]:
        return jsonify({"success": False, "message": "Invalid action"}), 400

    cursor.execute("UPDATE requests SET status = %s WHERE id = %s", (action, request_id))
    db.commit()

    return jsonify({"success": True, "message": f"Request {action} successfully"})

@app.route("/api/faculties", methods=["GET"])
def get_faculty_list():
    cursor = db.connection.cursor()
    cursor.execute("SELECT id, email FROM users WHERE role = 'faculty'")
    faculties = cursor.fetchall()
    cursor.close()
    return jsonify(faculties)


# ======================= Student Request Routes =======================
# Submit Student Request
@app.route("/api/student/request", methods=["POST"])
@jwt_required()
def submit_request():
    data = request.get_json()
    student_id = get_jwt_identity()
    faculty_id = data.get("faculty_id")
    title = data.get("title")
    description = data.get("description")

    if not faculty_id or not title or not description:
        return jsonify({"message": "All fields are required"}), 400

    new_request = Request(
        student_id=student_id,
        faculty_id=faculty_id,
        document_url="",
        status="pending"
    )
    db.session.add(new_request)
    db.session.commit()

    return jsonify({"message": "Request submitted successfully!"}), 201

if __name__ == "__main__":
    app.run(debug=True)
