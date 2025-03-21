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
import base64 #docusign
# from request_routes import request_routes

load_dotenv()
DOCUSIGN_CLIENT_ID = os.getenv("DOCUSIGN_CLIENT_ID")
DOCUSIGN_CLIENT_SECRET = os.getenv("DOCUSIGN_CLIENT_SECRET")
DOCUSIGN_USER_ID = os.getenv("DOCUSIGN_USER_ID")
DOCUSIGN_BASE_PATH = os.getenv("DOCUSIGN_BASE_PATH")

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
app.config["JWT_SECRET_KEY"] = "50c12acb3131ad7eea2c62e3571c1cc90e78021289d17b60f88681b22c8844cb"

jwt = JWTManager(app)

bcrypt = Bcrypt(app)

# app.register_blueprint(request_routes)

#uploads part
UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"pdf", "doc", "docx", "png", "jpg", "jpeg"}

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Ensure upload directory exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

#uploads part

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



@app.route("/api/faculty/requests", methods=["GET"])
@jwt_required()
def get_faculty_requests():
    faculty_id = get_jwt_identity()  # Get logged-in faculty ID
    cursor.execute(
        "SELECT r.id, u.email AS student_email, r.document_url, r.status FROM requests r JOIN users u ON r.student_id = u.id WHERE r.faculty_id = %s",
        (faculty_id,),
    )
    requests = cursor.fetchall()
    
    # Convert to JSON format
    request_list = [
        {
            "id": req[0],
            "student_email": req[1],
            "document_url": req[2],
            "status": req[3],
        }
        for req in requests
    ]

    return jsonify(request_list), 200



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


# Upload document route
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





# ----------------------------
@app.route("/api/faculty/esign", methods=["POST"])
@jwt_required()
def faculty_esign():
    faculty_id = get_jwt_identity()
    data = request.get_json()
    request_id = data.get("request_id")

    if not request_id:
        return jsonify({"message": "Request ID is required"}), 400

    cursor.execute("SELECT document_url FROM requests WHERE id = %s AND faculty_id = %s", (request_id, faculty_id))
    document = cursor.fetchone()

    if not document:
        return jsonify({"message": "Document not found"}), 404

    document_path = f"uploads/{document[0]}"
    
    # Read document for signing
    with open(document_path, "rb") as file:
        document_bytes = file.read()
    base64_doc = base64.b64encode(document_bytes).decode("utf-8")

    # Configure DocuSign API
    api_client = ApiClient()
    api_client.host = "https://demo.docusign.net/restapi"

    # Set up DocuSign authentication
    access_token = "YOUR_DOCUSIGN_ACCESS_TOKEN"
    account_id = "YOUR_DOCUSIGN_ACCOUNT_ID"

    api_client.set_default_header("Authorization", f"Bearer {access_token}")

    # Create Envelope
    envelope_api = EnvelopesApi(api_client)
    envelope_definition = EnvelopeDefinition(
        email_subject="Please sign the document",
        documents=[Document(
            document_base64=base64_doc,
            name="Requested Document",
            file_extension="pdf",
            document_id="1"
        )],
        recipients={"signers": [
            Signer(
                email="faculty@example.com",  # Get faculty email dynamically
                name="Faculty Name",
                recipient_id="1",
                tabs=Tabs(sign_here_tabs=[SignHere(anchor_string="Sign Here", anchor_units="pixels", anchor_x_offset="10", anchor_y_offset="20")])
            )
        ]},
        status="sent"
    )

    results = envelope_api.create_envelope(account_id, envelope_definition)
    envelope_id = results.envelope_id

    return jsonify({"message": "Signature request sent!", "envelope_id": envelope_id}), 200

@app.route("/api/faculty/submit_signed", methods=["POST"])
@jwt_required()
def submit_signed_document():
    faculty_id = get_jwt_identity()
    data = request.get_json()
    request_id = data.get("request_id")
    signed_document_url = data.get("signed_document_url")

    if not request_id or not signed_document_url:
        return jsonify({"message": "Request ID and signed document URL are required"}), 400

    cursor.execute("UPDATE requests SET status = 'signed' WHERE id = %s AND faculty_id = %s", (request_id, faculty_id))
    cursor.execute("UPDATE documents SET status = 'Signed', signed_by = %s WHERE id = %s", (faculty_id, request_id))
    db.connection.commit()

    return jsonify({"message": "Signed document submitted successfully!"}), 200


if __name__ == "__main__":
    app.run(debug=True)