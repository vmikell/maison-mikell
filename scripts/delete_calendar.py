#!/usr/bin/env python3
from pathlib import Path
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import sys

SCOPES = ['https://www.googleapis.com/auth/calendar']
CLIENT_SECRET = Path('/home/vboxuser/Downloads/client_secret_521736129971-3p5a8itaj85r4jdjbbc8736jv7hfiphj.apps.googleusercontent.com.json')
TOKEN_PATH = Path('/home/vboxuser/.secrets/maison-reset-google-token.json')


def get_creds():
    creds = None
    if TOKEN_PATH.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRET), SCOPES)
            creds = flow.run_local_server(port=0)
        TOKEN_PATH.parent.mkdir(parents=True, exist_ok=True)
        TOKEN_PATH.write_text(creds.to_json())
    return creds

if len(sys.argv) != 2:
    raise SystemExit('Usage: delete_calendar.py <calendar_id>')

calendar_id = sys.argv[1]
service = build('calendar', 'v3', credentials=get_creds())
service.calendars().delete(calendarId=calendar_id).execute()
print(f'Deleted {calendar_id}')
