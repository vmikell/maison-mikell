#!/usr/bin/env python3
from pathlib import Path
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import json
import sys

SCOPES = ['https://www.googleapis.com/auth/calendar']
CLIENT_SECRET = Path('/home/vboxuser/Downloads/client_secret_521736129971-3p5a8itaj85r4jdjbbc8736jv7hfiphj.apps.googleusercontent.com.json')
TOKEN_PATH = Path('/home/vboxuser/.secrets/maison-reset-google-token.json')
CALENDAR_ID = 'c2522bd5ec79eecca4cd55ef8ecd88b420b014870f0417426f7060cf9104e1c3@group.calendar.google.com'
PROJECT_ROOT = Path(__file__).resolve().parent.parent
PLANNER_EXPORT = PROJECT_ROOT / 'calendar-sync-preview.json'
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


def load_sync_items():
    if not PLANNER_EXPORT.exists():
        raise SystemExit(f'Missing planner export file: {PLANNER_EXPORT}')
    return json.loads(PLANNER_EXPORT.read_text())


def upsert_event(service, item):
    due = item['dueAt']
    reminder_minutes = int(item['leadDays']) * 24 * 60
    body = {
        'summary': f"Maison Reset — {item['title']}",
        'description': item.get('notes', ''),
        'start': {'date': due, 'timeZone': TIMEZONE},
        'end': {'date': due, 'timeZone': TIMEZONE},
        'reminders': {
            'useDefault': False,
            'overrides': [
                {'method': 'popup', 'minutes': reminder_minutes},
            ],
        },
        'extendedProperties': {
            'private': {
                'plannerTaskId': item['taskId'],
                'plannerReminderId': item['id'],
            }
        }
    }

    existing = service.events().list(
        calendarId=CALENDAR_ID,
        privateExtendedProperty=f"plannerReminderId={item['id']}",
        singleEvents=True,
    ).execute()

    if existing.get('items'):
        event_id = existing['items'][0]['id']
        service.events().update(calendarId=CALENDAR_ID, eventId=event_id, body=body).execute()
        return {'action': 'updated', 'eventId': event_id, 'title': item['title']}

    created = service.events().insert(calendarId=CALENDAR_ID, body=body).execute()
    return {'action': 'created', 'eventId': created['id'], 'title': item['title']}


def main():
    creds = get_creds()
    service = build('calendar', 'v3', credentials=creds, cache_discovery=False)
    items = load_sync_items()
    results = []

    try:
        for item in items:
            results.append(upsert_event(service, item))
        print(json.dumps({'calendarId': CALENDAR_ID, 'synced': results}, indent=2), flush=True)
    finally:
        http = getattr(service, '_http', None)
        if http is not None:
            close = getattr(http, 'close', None)
            if callable(close):
                close()


if __name__ == '__main__':
    main()
    sys.exit(0)
