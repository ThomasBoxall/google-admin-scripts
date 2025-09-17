import google.auth
from googleapiclient.discovery import build
from google.oauth2 import service_account

# --- Configuration ---
# The domain to list groups for.
DOMAIN = 'DOMAIN'

# Path to the service account key file you downloaded from Google Cloud.
SERVICE_ACCOUNT_FILE = 'PATHTOSERVICEACCOUNT'

# The email address of a admin in your domain to impersonate.
ADMIN_EMAIL = 'ADMINEMAIL'

# The scopes required for both APIs.
SCOPES = [
    'https://www.googleapis.com/auth/admin.directory.group.readonly',
    'https://www.googleapis.com/auth/apps.groups.settings'
]

def main():
    """
    Lists all Google Groups in a domain and their security settings.
    """
    try:
        # Authenticate with the service account and impersonate the admin.
        creds = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE,
            scopes=SCOPES,
            subject=ADMIN_EMAIL
        )
        
        # Build the Directory API and Groups Settings API services.
        service_directory = build('admin', 'directory_v1', credentials=creds)
        service_groups_settings = build('groupssettings', 'v1', credentials=creds)
        
        # Paginate through all groups in the domain.
        groups_list = []
        page_token = None
        while True:
            response = service_directory.groups().list(
                domain=DOMAIN,
                customer='my_customer',
                pageToken=page_token,
                maxResults=200
            ).execute()
            
            groups = response.get('groups', [])
            groups_list.extend(groups)
            
            page_token = response.get('nextPageToken')
            if not page_token:
                break
        
        if not groups_list:
            print(f'No groups found for the domain: {DOMAIN}')
            return
            
        print(f'Found {len(groups_list)} groups in the domain: {DOMAIN}\n')
        
        # For each group, get and print its security settings.
        for group in groups_list:
            group_email = group.get('email')
            group_name = group.get('name')
            
            try:
                settings = service_groups_settings.groups().get(groupUniqueId=group_email).execute()
                
                # print(f"{group_email} - {settings.get('whoCanViewGroup')} - {settings.get('whoCanViewMembership')}")

                # Define the new settings. For example, to change it to "ALL_MEMBERS_CAN_VIEW".

                # options: https://developers.google.com/workspace/admin/groups-settings/v1/reference/groups#resource
                new_settings = {
                    'whoCanViewGroup': 'ALL_MEMBERS_CAN_VIEW',
                    'whoCanViewMembership': 'ALL_MEMBERS_CAN_VIEW',
                    'whoCanInvite': 'NONE_CAN_INVITE',
                    'whoCanJoin': 'INVITED_CAN_JOIN',
                    'whoCanModerateMembers': 'NONE'
                }
                
                # Call the function to update the group.
                update_group_settings(service_groups_settings, group_email, new_settings)

                
            except Exception as e:
                print(f"Could not retrieve settings for group {group_email}: {e}")
                print("\n")
                
    except google.auth.exceptions.DefaultCredentialsError as e:
        print("Authentication error. Please ensure you have configured the service account correctly.")
        print(f"Details: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

def update_group_settings(service_groups_settings, group_email, new_settings):

    try:
        service_groups_settings.groups().update(
            groupUniqueId=group_email,
            body=new_settings
        ).execute()
        print(f"Successfully updated settings for group: {group_email}")
    except Exception as e:
        print(f"Failed to update settings for group {group_email}: {e}")

if __name__ == '__main__':
    main()