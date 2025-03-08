from flask import Blueprint, request, jsonify
from db import db, cursor
from flask_jwt_extended import jwt_required, get_jwt_identity

request_routes = Blueprint("request_routes", __name__)

# Student submits a request
@request_routes.route('/api/submit_request', methods=["POST"])
@jwt_required()
def submit_request():
    data = request.get_json()
    student_id = get_jwt_identity()  # Get logged-in student ID
    faculty_id = data.get("faculty_id")
    document_url = data.get("document_url")

    if not faculty_id or not document_url:
        return jsonify({"success": False, "message": "All fields are required"}), 400

    cursor.execute(
        "INSERT INTO requests (student_id, faculty_id, document_url) VALUES (%s, %s, %s)",
        (student_id, faculty_id, document_url)
    )
    db.commit()

    return jsonify({"success": True, "message": "Request submitted successfully"}), 201
# Faculty views their pending requests
@request_routes.route('/api/faculty/requests', methods=["GET"])
@jwt_required()
def get_faculty_requests():
    faculty_id = get_jwt_identity()  # Get logged-in faculty ID

    cursor.execute("SELECT * FROM requests WHERE faculty_id = %s AND status = 'pending'", (faculty_id,))
    requests = cursor.fetchall()

    return jsonify({"success": True, "requests": requests}), 200
# Faculty approves/rejects a request
@request_routes.route('/api/faculty/respond', methods=["POST"])
@jwt_required()
def respond_to_request():
    data = request.get_json()
    faculty_id = get_jwt_identity()
    request_id = data.get("request_id")
    action = data.get("action")  # "approved" or "rejected"

    if action not in ["approved", "rejected"]:
        return jsonify({"success": False, "message": "Invalid action"}), 400

    # Update the request status
    cursor.execute("UPDATE requests SET status = %s WHERE id = %s AND faculty_id = %s",
                   (action, request_id, faculty_id))
    db.commit()

    return jsonify({"success": True, "message": f"Request {action} successfully"}), 200
