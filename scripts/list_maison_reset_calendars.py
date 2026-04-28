#!/usr/bin/env python3
from pathlib import Path
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import json

SCOPES = ['https://www.googleapis.com/auth/calendar']
CLIENT_SECRET = Path.home() / 'Downloads' / 'client_secret_521736129971-3p5a8itaj85r4jdjbbc8736jv7hfiphj.apps.googleusercontent.com.json'
TOKEN_PATH = Path.home() / '.secrets' / 'maison-reset-google-token.json'


def get_creds():
    creds = None
    if TOKEN_PATH.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
    if not creds or not creds.valid:
        try:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                raise Exception('interactive_reauth_required')
        except Exception:
            flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRET), SCOPES)
            creds = flow.run_local_server(port=0)
        TOKEN_PATH.parent.mkdir(parents=True, exist_ok=True)
        TOKEN_PATH.write_text(creds.to_json())
    return creds


service = build('calendar', 'v3', credentials=get_creds())
items = service.calendarList().list().execute().get('items', [])
filtered = [
    {
        'id': item['id'],
        'summary': item.get('summary'),
        'accessRole': item.get('accessRole'),
        'primary': item.get('primary', False),
    }
    for item in items if item.get('summary') == 'Maison Reset'
]
print(json.dumps(filtered, indent=2))
