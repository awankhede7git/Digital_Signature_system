from flask import Flask, request, jsonify
import mysql.connector
from dotenv import load_dotenv
import os
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, JWTManager
from flask_jwt_extended import get_jwt_identity
from db import db, cursor
from werkzeug.utils import secure_filename#for uploads
import docusign_esign as docusign
from docusign_esign import ApiClient, EnvelopesApi, EnvelopeDefinition, Document, Signer, SignHere, Tabs, Recipients
import base64
from flask import Blueprint

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
CORS(app, origins=["http://localhost:5173"])

# CORS(app)  # Allow frontend requests

# JWT Configuration
app.config["JWT_SECRET_KEY"] = "50c12acb3131ad7eea2c62e3571c1cc90e78021289d17b60f88681b22c8844cb"

jwt = JWTManager(app)

bcrypt = Bcrypt(app)

faculty_bp = Blueprint("esign", __name__)

# -------------------------------------uploads part------------------------------------
UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"pdf", "doc", "docx", "png", "jpg", "jpeg"}

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Ensure upload directory exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

#-----------------------------------------uploads part over----------------------------------

#-----------------------------------------main route of backend----------------------------------

@app.route('/')
def home():
    return "Flask Backend is Running!"
#-----------------------------------------main route of backend ends--------------------------

#-----------------------------------------register-login routes--------------------------

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

# User role based login
@app.route('/api/login', methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password required"}), 400

    # Fetch user from database
    cursor = db.cursor()
    cursor.execute("SELECT id, password_hash, role FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()

    if user is None:
        return jsonify({"success": False, "message": "User not found"}), 401

    user_id, stored_hashed_password, role = user  # Unpacking the tuple

    if bcrypt.check_password_hash(stored_hashed_password, password):
        token = create_access_token(identity=user_id)

        # Redirect URLs based on role
        if role == "faculty":
            redirect_url = "http://127.0.0.1:5000/api/faculty/requests/{user_id}"
        else:
            redirect_url = "http://127.0.0.1:5000/api/student/dashboard/{user_id}"

        return jsonify({"success": True, "token": token, "role": role, "user_id": user_id, "redirect_url": redirect_url}), 200

    return jsonify({"success": False, "message": "Invalid credentials"}), 401

#-----------------------------------------register-login routes end--------------------------

#-----------------------------------------faculty-requests--------------------------------------

#to get requests for a particular faculty id, on loggin in as faculty-
@app.route('/api/faculty/requests/<int:faculty_id>', methods=["GET"])
def get_faculty_requests(faculty_id):
    cursor = db.cursor(dictionary=True)

    # Fetch requests for the given faculty_id
    query = """
        SELECT r.id, u.email AS student_email, r.document_url, r.status, r.envelope_id
        FROM requests r
        JOIN users u ON r.student_id = u.id
        WHERE r.faculty_id = %s
    """
    cursor.execute(query, (faculty_id,))
    
    requests = cursor.fetchall()
    
    # If no requests found, return empty list
    if not requests:
        return jsonify({"message": "No requests found for this faculty."}), 404

    return jsonify(requests), 200


# Approve request (Redirects to eSign page)
@app.route("/api/faculty/approve", methods=["POST"])
@jwt_required()
def approve_request():
    faculty_id = get_jwt_identity()
    data = request.get_json()
    request_id = data.get("request_id")

    if not request_id:
        return jsonify({"message": "Request ID is required"}), 400

    cursor = db.connection.cursor()
    cursor.execute("UPDATE requests SET status = 'approved' WHERE id = %s AND faculty_id = %s", (request_id, faculty_id))
    db.connection.commit()
    cursor.close()

    return jsonify({"message": "Request approved successfully!", "redirect_url": f"/esign/{request_id}"}), 200


    return jsonify({"success": True, "message": f"Request {action} successfully"})


@app.route('/api/faculties', methods=['GET'])
def get_faculties():
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id, email FROM users WHERE role = 'faculty'")
    faculties = cursor.fetchall()
    cursor.close()
    return jsonify(faculties)

#-----------------------------------------faculty-requests end--------------------------------------

#-----------------------------------------student-requests routes--------------------------------------
#student login redirects here
@app.route("/api/student/dashboard/<int:student_id>", methods=["GET"])
@jwt_required()
def student_dashboard(student_id):
    logged_in_student = get_jwt_identity()

    # Ensure students can only access their own data
    if int(logged_in_student) != student_id:
        return jsonify({"message": "Unauthorized access"}), 403

    # Fetch student requests
    cursor = db.connection.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT r.id, u.email AS faculty_email, r.document_url, r.status, r.created_at
        FROM requests r
        JOIN users u ON r.faculty_id = u.id
        WHERE r.student_id = %s
        """,
        (student_id,),
    )
    requests = cursor.fetchall()
    cursor.close()

    return jsonify(requests), 200



# Upload document route - this is our main student requests page cha route
@app.route("/api/student_request", methods=["POST"])
def student_request():
    print("Incoming request:", request.form)  # Debugging

    # Extract form data
    student_id = request.form.get("student_id")
    faculty_id = request.form.get("faculty_id")
    title = request.form.get("title")
    description = request.form.get("description")

    if not student_id or not faculty_id or not title or not description:
        print("Missing required fields")
        return jsonify({"error": "All fields are required"}), 400

    # Check if a file is uploaded
    if "file" not in request.files:
        print("No file found in request")
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        print("No file selected")
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        # Save file to uploads folder
        filename = secure_filename(file.filename)
        file_path = os.path.join("uploads", filename)  # Save path
        file.save(file_path)

        # Save document details in 'documents' table
        cursor = db.cursor()
        cursor.execute(
            "INSERT INTO documents (filename, uploaded_by, status) VALUES (%s, %s, %s)", 
            (file_path, student_id, "Pending")
        )
        db.commit()
        document_id = cursor.lastrowid  # Get the inserted document ID

        # Create request entry in 'requests' table
        cursor.execute(
            "INSERT INTO requests (student_id, faculty_id, document_url, status) VALUES (%s, %s, %s, %s)",
            (student_id, faculty_id, file_path, "pending")
        )
        db.commit()
        cursor.close()

        print(f"File uploaded successfully: {file_path}")
        return jsonify({
            "message": "Request submitted successfully",
            "document_id": document_id,
            "file_path": file_path
        }), 201

    print("Invalid file type")
    return jsonify({"error": "Invalid file type"}), 400

#-----------------------------------------student-requests routes ends--------------------------------------

#---------------------------------------esign----------------------------------------

#---------------------------------------esign ends----------------------------------------


if __name__ == "__main__":
    app.run(debug=True)