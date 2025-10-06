import argparse
import sys
import json
import logging
import socket

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.oauth2 import service_account
import google.cloud.logging


SCOPES = ['https://www.googleapis.com/auth/gmail.settings.sharing', 'https://www.googleapis.com/auth/gmail.settings.basic']

parser = argparse.ArgumentParser(
    prog='delegationmgr',
    description='Manages Delegations in Gmail',
    usage='%(prog)s -h | -l EMAIL | -g EMAIL -o EMAIL | -c EMAIL -o EMAIL | -d EMAIL -o EMAIL')

mutexParserGroup = parser.add_mutually_exclusive_group()
mutexParserGroup.add_argument('-c', '--create', help='create delegation access for specified EMAIL address', metavar='EMAIL')
mutexParserGroup.add_argument('-d', '--delete', help='deletes delegation access for specified EMAIL address', metavar='EMAIL')
mutexParserGroup.add_argument('-l', '--list', help='lists delegation access on specified EMAIL address', metavar='EMAIL' )
mutexParserGroup.add_argument('-g', '--get', help='gets delegation access on specified EMAIL address', metavar='EMAIL' )

parser.add_argument('-o', '--on', help='specify target EMAIL address to grant/revoke delegation access to/from or check delegation status on', metavar='EMAIL')

args = parser.parse_args()

if len(sys.argv) == 1:
    parser.print_help()
    sys.exit()

if (args.create or args.delete or args.get) and not args.on:
    parser.error("-o/--on is required when using -c | -d | -g")

# main body of code, a beaut int he.

# Construct credentials to be used

SERVICE_ACCOUNT_FILE = 'service_account_key.json'

with open(SERVICE_ACCOUNT_FILE, 'r') as f:
    service_account_info = json.load(f)
    projectID = service_account_info.get('project_id')

credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES)

# setup logging to Google Cloud Logging
# Instantiates a client
client = google.cloud.logging.Client.from_service_account_json(SERVICE_ACCOUNT_FILE)

# Retrieves a Cloud Logging handler based on the environment
handler = client.get_default_handler()

# Sets up basic logging

logToWriteTo = "projects/" + projectID + "/logs/python"
logger = logging.getLogger(logToWriteTo)
logger.setLevel(logging.INFO)
logger.addHandler(handler)

# different options for what we can be doing
if args.create:
    # Create delegation
    # Requires
    # - args.create (the email address which will be given access)
    # - args.on (the email address which will have access granted to

    # first setup delegated creds
    delegated_credentials = credentials.with_subject(args.on)

    logger.info(f"New activity on {socket.gethostname()}: granting access to {args.create} for mailbox {args.on}")

    # have a bash and see what happens
    try:
        service = build('gmail', 'v1', credentials=delegated_credentials)

        # Email address of how is getting permission to manage the inbox 

        body = {
            'delegateEmail': args.create,
            'verificationStatus': 'accepted'
            }
        request = service.users().settings().delegates().create(userId='me', body=body).execute()
        print(request)
        

    except HttpError as error:
        print(f'An error occurred: {error}')

elif args.delete:
    # deletes delegations
    # Requires
    # - args.delete (the email address whose access will be revoked)
    # - args.on (the email address which will no longer be able to be accessed)

    delegated_credentials = credentials.with_subject(args.on)

    logger.info(f"New activity on {socket.gethostname()}: revoking access to {args.create} for mailbox {args.on}")

    try:
        service = build('gmail', 'v1', credentials=delegated_credentials)

        # Email address of how is getting permission to manage the inbox 
        request = service.users().settings().delegates().delete(userId='me', delegateEmail=args.delete).execute()
        print(request)
        

    except HttpError as error:
        print(f'An error occurred: {error}')

elif args.list:
    # list delegation on specific account
    # Requires
    # - args.list (the email address whose delegations you wish to view)

    logger.info(f"New activity on {socket.gethostname()}: querying all delegations to {args.list}")
    
    delegated_credentials = credentials.with_subject(args.list)

    try:
        service = build('gmail', 'v1', credentials=delegated_credentials)

        # Email address of how is getting permission to manage the inbox 
        request = service.users().settings().delegates().list(userId='me').execute()

        if request:
            # there is a delegate there so we want to try to print nicely
            print("Delegates:")
            for i in range(0, len(request['delegates'])):
                print(f"{request['delegates'][i]['delegateEmail']} {(request['delegates'][i]['verificationStatus'])}")
        else:
            print("No delegates")
        

    except HttpError as error:
        print(f'An error occurred: {error}')

elif args.get:
    # Gets delegation status of specified EMAIL address on specified account
    # Requires
    # - args.get (the email address who you're querying)
    # - args.on (the email address you wish to query against)

    delegated_credentials = credentials.with_subject(args.on)

    logger.info(f"New activity on {socket.gethostname()}: querying access to {args.create} for mailbox {args.on}")

    try:
        service = build('gmail', 'v1', credentials=delegated_credentials)

        # Email address of how is getting permission to manage the inbox 
        request = service.users().settings().delegates().get(userId='me', delegateEmail=args.get).execute()
        print(request) 


    except HttpError as error:
        if error.resp.status == 404:
            print("404")
        print(f'An error occurred: {error}')