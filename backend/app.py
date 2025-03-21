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
CORS(app)  # Allow frontend requests

# JWT Configuration
app.config["JWT_SECRET_KEY"] = "50c12acb3131ad7eea2c62e3571c1cc90e78021289d17b60f88681b22c8844cb"

jwt = JWTManager(app)

bcrypt = Bcrypt(app)

esign_bp = Blueprint("esign", __name__)

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
# @app.route('/api/login', methods=["POST"])
# def login():
#     data = request.get_json()
#     email = data.get("email")
#     password = data.get("password")

#     if not email or not password:
#         return jsonify({"success": False, "message": "Email and password required"}), 400

#     # Fetch user from database
#     cursor = db.cursor()
#     cursor.execute("SELECT id, password_hash, role FROM users WHERE email = %s", (email,))
#     user = cursor.fetchone()

#     if user is None:
#         return jsonify({"success": False, "message": "User not found"}), 401

#     user_id, stored_hashed_password, role = user  # Unpacking the tuple

#     if bcrypt.check_password_hash(stored_hashed_password, password):
#         token = create_access_token(identity=user_id)

#         # Redirect URLs based on role
#         if role == "faculty":
#             redirect_url = "http://127.0.0.1:5000/api/faculty/requests/{user_id}"
#         else:
#             redirect_url = "http://127.0.0.1:5000/api/student/dashboard/{user_id}"

#         return jsonify({"success": True, "token": token, "role": role, "user_id": user_id, "redirect_url": redirect_url}), 200

#     return jsonify({"success": False, "message": "Invalid credentials"}), 401

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
#login redirects here
# @app.route("/api/student/dashboard/<int:student_id>", methods=["GET", "POST"])
# @jwt_required()
# def student_dashboard(student_id):
#     logged_in_student = get_jwt_identity()

#     # Ensure students can only view their own requests
#     if logged_in_student != student_id:
#         return jsonify({"message": "Unauthorized access"}), 403

#     if request.method == "POST":
#         data = request.get_json()
#         faculty_id = data.get("faculty_id")
#         title = data.get("title")
#         description = data.get("description")

#         if not faculty_id or not title or not description:
#             return jsonify({"message": "All fields are required"}), 400

#         new_request = Request(
#             student_id=student_id,
#             faculty_id=faculty_id,
#             document_url="",
#             status="pending"
#         )
#         db.session.add(new_request)
#         db.session.commit()

#         return jsonify({"message": "Request submitted successfully!"}), 201

#     # Fetch student requests
#     cursor = db.cursor(dictionary=True)
#     query = """
#         SELECT r.id, u.email AS faculty_email, r.document_url, r.status, r.created_at
#         FROM requests r
#         JOIN users u ON r.faculty_id = u.id
#         WHERE r.student_id = %s
#     """
#     cursor.execute(query, (student_id,))
#     requests = cursor.fetchall()

#     # If no requests found, return empty list
#     if not requests:
#         return jsonify({"message": "No requests found for this student."}), 404

#     return jsonify(requests), 200
#//////////////////////////////////WORK ON THE NICHE WALA Student-dashboard////////////////////////////////////

# @app.route("/api/student/dashboard/<int:student_id>", methods=["GET", "POST"])
# @jwt_required()
# def student_dashboard(student_id):
#     logged_in_student = get_jwt_identity()

#     # Ensure students can only access their own data
#     if int(logged_in_student) != student_id:
#         return jsonify({"message": "Unauthorized access"}), 403

#     if request.method == "POST":
#         data = request.get_json()
#         faculty_id = data.get("faculty_id")
#         title = data.get("title")
#         description = data.get("description")

#         if not faculty_id or not title or not description:
#             return jsonify({"message": "All fields are required"}), 400

#         new_request = Request(
#             student_id=student_id,
#             faculty_id=faculty_id,
#             document_url="",  
#             status="pending"
#         )
#         db.session.add(new_request)
#         db.session.commit()

#         return jsonify({"message": "Request submitted successfully!"}), 201

#     # Fetch student requests
#     requests = db.session.execute("""
#         SELECT r.id, u.email AS faculty_email, r.document_url, r.status, r.created_at
#         FROM requests r
#         JOIN users u ON r.faculty_id = u.id
#         WHERE r.student_id = :student_id
#     """, {"student_id": student_id}).fetchall()

#     # Convert result into list of dictionaries
#     request_list = [
#         {
#             "id": req.id,
#             "faculty_email": req.faculty_email,
#             "document_url": req.document_url,
#             "status": req.status,
#             "created_at": req.created_at
#         }
#         for req in requests
#     ]

#     return jsonify(request_list), 200



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
# Configure DocuSign API
def get_docusign_client():
    api_client = ApiClient()
    api_client.host = os.getenv("DOCUSIGN_BASE_URL")
    api_client.set_base_path("/v2.1/accounts/" + os.getenv("DOCUSIGN_ACCOUNT_ID"))
    api_client.set_oauth_token("YOUR_OAUTH_ACCESS_TOKEN")
    return api_client

@esign_bp.route("/api/send-signature-request", methods=["POST"])
def send_signature_request():
    data = request.json
    faculty_id = data.get("faculty_id")
    document_url = data.get("document_url")

    if not faculty_id or not document_url:
        return jsonify({"error": "Faculty ID and Document URL are required"}), 400

    # Read file
    with open(document_url, "rb") as file:
        file_base64 = base64.b64encode(file.read()).decode("utf-8")

    # Prepare document for signing
    doc = Document(
        document_base64=file_base64,
        name="Student Request",
        file_extension="pdf",
        document_id="1"
    )

    # Define recipient (Faculty)
    signer = Signer(
        email="faculty@example.com",  # Fetch dynamically from DB
        name="Faculty Name",  # Fetch dynamically
        recipient_id="1",
        routing_order="1",
        tabs=Tabs(sign_here_tabs=[SignHere(document_id="1", page_number="1", x_position="200", y_position="500")])
    )

    # Create envelope
    envelope_definition = EnvelopeDefinition(
        email_subject="Please sign the document",
        documents=[doc],
        recipients=Recipients(signers=[signer]),
        status="sent"
    )

    # Send envelope
    api_client = get_docusign_client()
    envelopes_api = EnvelopesApi(api_client)
    results = envelopes_api.create_envelope(os.getenv("DOCUSIGN_ACCOUNT_ID"), envelope_definition)

    return jsonify({"message": "Signature request sent", "envelope_id": results.envelope_id}), 200


@esign_bp.route("/api/check-signature-status/<envelope_id>", methods=["GET"])
def check_signature_status(envelope_id):
    try:
        api_client = get_docusign_client()
        envelopes_api = EnvelopesApi(api_client)
        envelope = envelopes_api.get_envelope(os.getenv("DOCUSIGN_ACCOUNT_ID"), envelope_id)

        if envelope.status == "completed":
            # Update request status in database
            cursor = db.cursor()
            cursor.execute("UPDATE requests SET status=%s WHERE envelope_id=%s", ("signed", envelope_id))
            db.commit()
            cursor.close()

            return jsonify({"message": "Document signed successfully"}), 200

        return jsonify({"message": "Document not yet signed"}), 202

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@esign_bp.route("/api/faculty/esign", methods=["POST"])
def faculty_esign():
    data = request.json
    request_id = data.get("request_id")

    # Fetch document details from DB
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT document_url FROM requests WHERE id = %s", (request_id,))
    request = cursor.fetchone()

    if not request:
        return jsonify({"error": "Request not found"}), 404

    document_url = request["document_url"]

    # Send document to DocuSign API
    envelope_id = send_document_for_signing(document_url)  # Call DocuSign API here

    if not envelope_id:
        return jsonify({"error": "Failed to send document for signing"}), 500

    # Update requests table with envelope_id
    cursor.execute("UPDATE requests SET envelope_id = %s WHERE id = %s", (envelope_id, request_id))
    db.commit()
    cursor.close()

    return jsonify({"message": "Document sent for signing", "envelope_id": envelope_id}), 200

#---------------------------------------esign ends----------------------------------------


if __name__ == "__main__":
    app.run(debug=True)