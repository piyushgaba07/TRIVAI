import os
from typing import List

from google.oauth2 import id_token
from google.auth.transport import requests
from fastapi import HTTPException, status
from dotenv import load_dotenv

load_dotenv()

def _collect_google_client_ids() -> List[str]:
    raw_ids = [
        os.getenv("GOOGLE_CLIENT_ID"),
        os.getenv("NEXT_PUBLIC_GOOGLE_CLIENT_ID"),
    ]

    extra_ids = os.getenv("GOOGLE_CLIENT_IDS")
    if extra_ids:
        raw_ids.extend(extra_ids.split(","))

    cleaned_ids = []
    for value in raw_ids:
        if value:
            candidate = value.strip()
            if candidate and candidate not in cleaned_ids:
                cleaned_ids.append(candidate)
    return cleaned_ids

GOOGLE_CLIENT_IDS = _collect_google_client_ids()

if not GOOGLE_CLIENT_IDS:
    raise ValueError("At least one Google client ID environment variable must be set")

VALID_ISSUERS = {'accounts.google.com', 'https://accounts.google.com'}

async def verify_google_token(token: str) -> dict:
    last_error: Exception | None = None
    request_adapter = requests.Request()

    for client_id in GOOGLE_CLIENT_IDS:
        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                request_adapter,
                client_id,
            )

            if idinfo.get('iss') not in VALID_ISSUERS:
                raise ValueError('Wrong issuer for Google token.')

            return {
                'email': idinfo['email'],
                'name': idinfo.get('name', ''),
                'picture': idinfo.get('picture', ''),
                'google_id': idinfo['sub']
            }
        except ValueError as e:
            last_error = e
            continue
        except Exception as e:
            last_error = e
            break

    if isinstance(last_error, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(last_error)}"
        )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Error verifying Google token: {str(last_error) if last_error else 'Unknown error'}"
    )
