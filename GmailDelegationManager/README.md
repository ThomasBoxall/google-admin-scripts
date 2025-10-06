# Gmail Delegations Manager 

> Manages Gmail Delegations

The latest in my quick and dirty scripts to do things, because Google's Admin Console is pants and doesn't give you any of the options that, y'know, are useful. Cheers Google, hella useful aren't you.

## Authentication
Requires a Service Account with the Gmail API enabled, setup through a Google Cloud Project. Service Account needs Domain Wide Delegation for the following scopes:
```
https://www.googleapis.com/auth/gmail.settings.sharing
https://www.googleapis.com/auth/gmail.readonly
```

This is _obviously_ a lot of power to be giving a service account as it can effectively mean anyone with the script can read anyone elses emails within the Google Workspace Tennant. You've been warned.

Stick your service account credentials (downloaded in JSON flavour) in a file called `service_account_key.json` and you should be cooking on gas.

## Packages
Requires:
* googleapiclient.discovery
* googleapiclient.errors
* google.oauth2
* google.cloud.logging

Run the following to solve your problems
```
pip install --upgrade google-api-python-client google-auth-httplib2 google-auth-oauthlib google-cloud-logging
```

## Usage
```
python3 delegationmanager.py -h | -l EMAIL | -g EMAIL -o EMAIL | -c EMAIL -o EMAIL | -d EMAIL -o EMAIL
```
Yep, that's all the documentation you're getting. Go break some stuff :D

Script logs to the "python" log in the Google Cloud Project to keep tabs on what's going on. 

## Disclaimer
If you run this script and it breaks your Google Workspace Tennant, not my problem. You run it at your own costs.

Developed on Fedora 41. Doubt it'll work on Windows. Use a proper operating system.