#!/usr/bin/env python3
from pathlib import Path
from google_auth_oauthlib.flow import InstalledAppFlow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import json
import os

SCOPES = ['https://www.googleapis.com/auth/calendar']
CLIENT_SECRET = Path('/home/vboxuser/Downloads/client_secret_521736129971-3p5a8itaj85r4jdjbbc8736jv7hfiphj.apps.googleusercontent.com.json')
TOKEN_PATH = Path('/home/vboxuser/.secrets/maison-reset-google-token.json')
VICTOR_EMAIL = 'victormikell@gmail.com'
RIAH_EMAIL = 'mneuroth@gmail.com'
CALENDAR_NAME = 'Maison Reset'
TIMEZONE = 'America/New_York'


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


def main():
    creds = get_creds()
    service = build('calendar', 'v3', credentials=creds)

    calendar = service.calendars().insert(body={
        'summary': CALENDAR_NAME,
        'timeZone': TIMEZONE,
    }).execute()

    calendar_id = calendar['id']

    service.acl().insert(
        calendarId=calendar_id,
        body={
            'role': 'writer',
            'scope': {
                'type': 'user',
                'value': RIAH_EMAIL,
            },
        },
        sendNotifications=True,
    ).execute()

    print(json.dumps({
        'calendarId': calendar_id,
        'summary': calendar.get('summary'),
        'timeZone': calendar.get('timeZone'),
        'sharedWith': [VICTOR_EMAIL, RIAH_EMAIL],
        'tokenPath': str(TOKEN_PATH),
    }, indent=2))


if __name__ == '__main__':
    main()
