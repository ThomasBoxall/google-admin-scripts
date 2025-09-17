# GroupPermissionReset

A Python (yes bringing out the big mallet here) script to nuke all permissions on Google Groups because they're unruley and possibly being a bit leaky around GDPR...

Usual bit of PIP-ing to get some packages ship shape:
`pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib`

Needs a Google Cloud Project setup with the following APIs enabled:
* Admin SDK API
* Groups Settings API

Uses Service Account with JSON Keys - insert path into python script.

Domain Delegation in Admin Console for the following scopes for the relevant service account:
* `https://www.googleapis.com/auth/admin.directory.group.readonly`
* `https://www.googleapis.com/auth/apps.groups.settings`

Add email of admin into the script in the `ADMIN_EMAIL` var. This will show up in the Google Admin Audit Log - good luck. Add domain into the `DOMAIN` var.

Will go through every group in the domain and set settings as specified in the `new_settings` dictionary. Currently set to maximum security.

Check your all@ group carefully afterwards. It might be a bit broke. 

Credits to Gemini for some of the code. Cheers bestie. xx