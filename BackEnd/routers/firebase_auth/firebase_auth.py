# BackEnd/routers/firebase_auth/firebase_auth.py
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(env_path)

from fastapi import HTTPException
import google.auth.transport.requests
from google.oauth2 import id_token
import os

FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID")


# def verify_firebase_token(token: str):
#     """
#     Validates a Firebase Web ID Token.
#     Ensures correct audience (projectId).
#     """
#     try:
#         request = google.auth.transport.requests.Request()

#         decoded_token = id_token.verify_oauth2_token(
#             token,
#             request,
#             audience=FIREBASE_PROJECT_ID
#         )

#         # If Firebase issues provider-specific tokens, we ensure issuer matches:
#         if not decoded_token.get("iss", "").startswith("https://securetoken.google.com/"):
#             raise HTTPException(401, "Invalid issuer in Firebase token")

#         return decoded_token

#     except Exception as e:
#         print("TOKEN ERROR:", e)
#         raise HTTPException(status_code=401, detail="Invalid Firebase token")


## TOKEN VERIFICATION WITH DEBUGGING INFO
from fastapi import HTTPException
from google.oauth2 import id_token
from google.auth.transport import requests
import os

FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID")

def verify_firebase_token(token: str):
    print("\n================ VERIFY TOKEN DEBUG ================")
    print("Received Token:", token[:50], "...")  # print first 50 chars only

    try:
        # Decode token
        decoded = id_token.verify_firebase_token(token, requests.Request())

        print("\n--- DECODED TOKEN ---")
        for k, v in decoded.items():
            print(f"{k}: {v}")

        # Compare project ID
        aud = decoded.get("aud")
        iss = decoded.get("iss")

        print("\nExpected FIREBASE_PROJECT_ID:", FIREBASE_PROJECT_ID)
        print("Token aud:", aud)
        print("Token iss:", iss)

        # Validations
        if aud != FIREBASE_PROJECT_ID:
            print("❌ ERROR: Audience mismatch!")
            raise HTTPException(401, "Invalid audience")

        if not iss.startswith("https://securetoken.google.com/"):
            print("❌ ERROR: Invalid issuer format!")
            raise HTTPException(401, "Invalid issuer format")

        if not iss.endswith(FIREBASE_PROJECT_ID):
            print("❌ ERROR: Issuer project mismatch!")
            raise HTTPException(401, "Invalid issuer")

        print("✅ TOKEN OK — Returning decoded payload")
        print("====================================================\n")

        return decoded

    except Exception as e:
        print("\n🔥 TOKEN VERIFICATION FAILED!")
        print("Error type:", type(e))
        print("Error message:", str(e))
        print("====================================================\n")
        raise HTTPException(401, f"Invalid Firebase token: {str(e)}")
