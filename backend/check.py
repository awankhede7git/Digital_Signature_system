from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

stored_hashed_password = "$2b$12$GepAqPK70BQ3Bdj5zZEraOQfzbwoEjV5xaQdfr0dR1Z69KMTvgHm2"
password_attempt = "random"  # Replace with actual password

if bcrypt.check_password_hash(stored_hashed_password, password_attempt):
    print("Password match!")
else:
    print("Password mismatch!")
