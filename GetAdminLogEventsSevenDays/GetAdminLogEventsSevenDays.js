/**
GetAdminLogEventsSevenDays - Audit script to email people with a list of admin audit events within the last 7 days. Used to audit whats going on in the Google Workspace.

SCHEDULED TRIGGER to run time-based, weekly, Midnight to 1am on a Monday

**/

// the big doom map of events. Good luck decipering this. Generated using a spreadsheet and far too much coffee.
// known limits: doesn't include events from: Google Talk; ChromeOS; and Mobile Devices category as we don't use them. Should be able to be added in resonably easily.
// doesn't include anything with type SECURITY_INVESTIGATION because Google doesn't publish a list of all of the events. It will just dump the raw event in those cases.
const EVENT_DESCRIPTIONS = {
  // alert centre view
  'ALERT_CENTER_VIEW' : 'Alert {ALERT_ID} viewed', 

  // admin: application
  'CHANGE_APPLICATION_SETTING' : 'For {APPLICATION_NAME}, {SETTING_NAME} changed from {OLD_VALUE} to {NEW_VALUE}',
  'CREATE_APPLICATION_SETTING' : 'For {APPLICATION_NAME}, {SETTING_NAME} created with value {NEW_VALUE}',
  'CREATE_MANAGED_CONFIGURATION' : 'Managed configuration with name {MANAGED_CONFIGURATION_NAME} is created for {DEVICE_TYPE} application {MOBILE_APP_PACKAGE_ID}.',
  'DELETE_APPLICATION_SETTING' : 'For {APPLICATION_NAME}, {SETTING_NAME} with value {OLD_VALUE} deleted',
  'DELETE_MANAGED_CONFIGURATION' : 'Managed configuration with name {MANAGED_CONFIGURATION_NAME} is deleted for {DEVICE_TYPE} application {MOBILE_APP_PACKAGE_ID}.',
  'FLASHLIGHT_EDU_NON_FEATURED_SERVICES_SELECTED' : '{FLASHLIGHT_EDU_NON_FEATURED_SERVICES_SELECTION} selection was made for Non-Featured Services.',
  'GPLUS_PREMIUM_FEATURES' : 'Premium features for Google+ service for your organization changed to {NEW_VALUE}',
  'REORDER_GROUP_BASED_POLICIES_EVENT' : 'For {APPLICATION_NAME}, group override priorities for {SETTING_NAME} changed to {GROUP_PRIORITIES}.',
  'UPDATE_MANAGED_CONFIGURATION' : 'Managed configuration with name {MANAGED_CONFIGURATION_NAME} is updated for {DEVICE_TYPE} application {MOBILE_APP_PACKAGE_ID}.',
  'UPDATE_SMART_FEATURES' : 'Smart features and personalization setting has been updated to {NEW_VALUE}',

  // admin: calendar
  'CANCEL_CALENDAR_EVENTS' : 'Event cancellation request created for {USER_EMAIL}',
  'CHANGE_CALENDAR_SETTING' : '{SETTING_NAME} for calendar service in your organization changed from {OLD_VALUE} to {NEW_VALUE}',
  'CREATE_BUILDING' : 'Building {NEW_VALUE} created',
  'CREATE_CALENDAR_RESOURCE' : 'Calendar resource {NEW_VALUE} created',
  'CREATE_CALENDAR_RESOURCE_FEATURE' : 'Calendar resource feature {NEW_VALUE} created',
  'DELETE_BUILDING' : 'Building {OLD_VALUE} deleted',
  'DELETE_CALENDAR_RESOURCE' : 'Calendar resource {OLD_VALUE} deleted',
  'DELETE_CALENDAR_RESOURCE_FEATURE' : 'Calendar resource feature {OLD_VALUE} deleted',
  'EWS_IN_NEW_CREDENTIALS_GENERATED' : 'New Calendar Interop Exchange authentication credentials were generated for the Google role account {EXCHANGE_ROLE_ACCOUNT}',
  'EWS_OUT_ENDPOINT_CONFIGURATION_CHANGED' : 'Calendar Interop Exchange endpoint configuration was set/updated with default endpoint URL {EXCHANGE_WEB_SERVICES_URL} and Exchange role account {EXCHANGE_ROLE_ACCOUNT} and {NUMBER_OF_ADDITIONAL_EXCHANGE_ENDPOINTS} additional endpoints',
  'EWS_OUT_ENDPOINT_CONFIGURATION_RESET' : 'Calendar Interop Exchange endpoint configuration was cleared',
  'RELEASE_CALENDAR_RESOURCES' : 'Release resources request created for {USER_EMAIL}',
  'RENAME_CALENDAR_RESOURCE' : 'Calendar resource {OLD_VALUE} renamed to {NEW_VALUE}',
  'UPDATE_BUILDING' : 'Building {RESOURCE_IDENTIFIER} updated field {FIELD_NAME} from {OLD_VALUE} to {NEW_VALUE}',
  'UPDATE_CALENDAR_RESOURCE' : 'Calendar resource {RESOURCE_IDENTIFIER} updated field {FIELD_NAME} from {OLD_VALUE} to {NEW_VALUE}',
  'UPDATE_CALENDAR_RESOURCE_FEATURE' : 'Calendar resource feature {RESOURCE_IDENTIFIER} updated field {FIELD_NAME} from {OLD_VALUE} to {NEW_VALUE}',

  // admin: contacts
  'CHANGE_CONTACTS_SETTING' : '{SETTING_NAME} for contacts service changed from {OLD_VALUE} to {NEW_VALUE}',

  // admin: delegated admin
  'ADD_PRIVILEGE' : 'New privilege {PRIVILEGE_NAME} created under role {ROLE_NAME}',
  'ASSIGN_ROLE' : 'Role {ROLE_NAME} assigned to user {USER_EMAIL}',
  'CREATE_ROLE' : 'New role {ROLE_NAME} created',
  'DELETE_ROLE' : 'Role {ROLE_NAME} deleted',
  'REMOVE_PRIVILEGE' : 'Privilege {PRIVILEGE_NAME} removed from role {ROLE_NAME}',
  'RENAME_ROLE' : 'Role renamed from {ROLE_NAME} to {NEW_VALUE}',
  'UNASSIGN_ROLE' : 'Unassigned role {ROLE_NAME} from user {USER_EMAIL}',
  'UPDATE_ROLE' : 'Role {ROLE_NAME} updated',

  // admin: drive
  'CHANGE_DOCS_SETTING' : '{SETTING_NAME} for Drive changed from {OLD_VALUE} to {NEW_VALUE}',
  'DOCS_ORG_BRANDING_PROVISIONING' : 'Organizational branding provisioning initiated for account {SERVICE_ACCOUNT_EMAIL} and shared drive {SHARED_DRIVE_NAME} with status {ORG_BRANDING_PROVISIONING_STATUS}',
  'DOCS_ORG_BRANDING_UPLOAD' : 'Organizational branding document upload attempted for document {DOCUMENT_ID} in editor {ORG_BRANDING_EDITOR_TYPE} with status {ORG_BRANDING_UPLOAD_STATUS}',
  'DRIVE_DATA_RESTORE' : 'Drive data restoration initiated for {USER_EMAIL}',
  'MOVE_SHARED_DRIVE_TO_ORG_UNIT' : 'Shared drive {SHARED_DRIVE_ID} moved from {ORG_UNIT_NAME} to {NEW_VALUE}',
  'TRANSFER_DOCUMENT_OWNERSHIP' : 'Owner of documents changed from {USER_EMAIL} to {NEW_VALUE}',

  // admin: drive
  'ADD_APPLICATION' : 'Application {APPLICATION_NAME} with id {APP_ID} has been added to the domain',
  'ADD_APPLICATION_TO_WHITELIST' : 'Application {APPLICATION_NAME} with id {APP_ID} has been added to whitelist for the domain',
  'ADD_DOMAIN_ALIAS' : 'An unverified {DOMAIN_ALIAS} created as an alias of {DOMAIN_NAME}',
  'ADD_SECONDARY_DOMAIN' : 'An unverified {SECONDARY_DOMAIN_NAME} created as a secondary domain of {DOMAIN_NAME}',
  'ADD_TRUSTED_DOMAINS' : 'Domains {DOMAIN_NAME} added to Trusted Domains list',
  'ALERT_RECEIVERS_CHANGED' : 'Alert receivers for {ALERT_NAME} changed from {OLD_VALUE} to {NEW_VALUE}',
  'ALERT_STATUS_CHANGED' : 'Alert status for {ALERT_NAME} changed from {OLD_VALUE} to {NEW_VALUE}',
  'AUTHORIZE_API_CLIENT_ACCESS' : 'API client access to your organization from client {API_CLIENT_NAME} authorized for scopes {API_SCOPES}',
  'CHANGE_ACCOUNT_AUTO_RENEWAL' : 'Account automatic renewal changed to {NEW_VALUE} on {DOMAIN_NAME}',
  'CHANGE_ADVERTISEMENT_OPTION' : 'Advertisement option for your organization changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_ALERT_CRITERIA' : 'Alert criteria for {ALERT_NAME} has been changed',
  'CHANGE_CONFLICT_ACCOUNT_ACTION' : 'Conflict account action for {DOMAIN_NAME} changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_CONFLICT_ACCOUNTS_MANAGEMENT_SETTINGS' : 'Conflict accounts management setting changed to: {CONFLICT_ACCOUNTS_MANAGEMENT_SETTINGS}.',
  'CHANGE_CUSTOM_LOGO' : 'New custom logo uploaded for your organization',
  'CHANGE_DATA_LOCALIZATION_FOR_RUSSIA' : 'Setting for Data Localization for Russian Federation changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_DATA_LOCALIZATION_SETTING' : 'Setting for Data Localization changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_DATA_PROTECTION_OFFICER_CONTACT_INFO' : 'Data Protection Officer {INFO_TYPE} changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_DOMAIN_DEFAULT_LOCALE' : 'Default locale for your organization changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_DOMAIN_DEFAULT_TIMEZONE' : 'Default time zone for your organization changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_DOMAIN_NAME' : 'Change of domain name for {DOMAIN_NAME} to {NEW_VALUE} started',
  'CHANGE_DOMAIN_SUPPORT_MESSAGE' : 'Support message for your organization changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_EDU_TYPE' : 'Educational organization type changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_EU_REPRESENTATIVE_CONTACT_INFO' : 'EU Representative {INFO_TYPE} changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_LOGIN_ACTIVITY_TRACE' : 'Marketplace Login audit setting in {DOMAIN_NAME} changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_LOGIN_BACKGROUND_COLOR' : 'Login background color for your organization changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_LOGIN_BORDER_COLOR' : 'Login border color for your organization changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_ORGANIZATION_NAME' : 'Organization name changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_PASSWORD_MAX_LENGTH' : 'Password maximum length for {DOMAIN_NAME} changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_PASSWORD_MIN_LENGTH' : 'Primary admin for your organization changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_PRIMARY_DOMAIN' : 'Primary domain name changed from {DOMAIN_NAME} to {NEW_VALUE}',
  'CHANGE_RENEW_DOMAIN_REGISTRATION' : 'Renew domain registration setting in {DOMAIN_NAME} changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_RESELLER_ACCESS' : 'Reseller access changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_RESELLER_ACCESS_FOR_SKU' : 'Reseller access for {SKU_NAME} changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_RULE_CRITERIA' : 'Rule criteria for {RULE_NAME} has been changed',
  'CHANGE_SSO_SETTINGS' : 'SSO settings changed for {DOMAIN_NAME}',
  'CHANGE_WHITELIST_SETTING' : '{SETTING_NAME} changed from {OLD_VALUE} to {NEW_VALUE} for the domain',
  'CHROME_LICENSES_REDEEMED' : '{CHROME_NUM_LICENSES_PURCHASED} app licenses redeemed for application {APPLICATION_NAME} using order {APP_LICENSES_ORDER_NUMBER}',
  'COMMUNICATION_PREFERENCES_SETTING_CHANGE' : '{SETTING_NAME} setting in Communication Preferences changed from {OLD_VALUE} to {NEW_VALUE} (Domain Name : {DOMAIN_NAME})',
  'CREATE_ALERT' : 'Alert {ALERT_NAME} has been created',
  'CREATE_PLAY_FOR_WORK_TOKEN' : 'MDM vendor enrollment token ({PLAY_FOR_WORK_TOKEN_ID}) created',
  'CREATE_RULE' : 'Rule {RULE_NAME} has been created',
  'DELETE_ALERT' : 'Alert {ALERT_NAME} has been deleted',
  'DELETE_PLAY_FOR_WORK_TOKEN' : 'MDM vendor enrollment token ({PLAY_FOR_WORK_TOKEN_ID}) deleted',
  'DELETE_RULE' : 'Rule {RULE_NAME} has been deleted',
  'ENABLE_API_ACCESS' : 'API access for your organization changed from {OLD_VALUE} to {NEW_VALUE}',
  'ENABLE_FEEDBACK_SOLICITATION' : 'Can contact for feedback setting for your organization changed from {OLD_VALUE} to {NEW_VALUE}',
  'ENABLE_SERVICE_OR_FEATURE_NOTIFICATIONS' : 'Receive email notification setting for your organization changed from {OLD_VALUE} to {NEW_VALUE}',
  'GENERATE_PIN' : 'Customer support PIN generated',
  'GENERATE_TRANSFER_TOKEN' : 'Transfer token generated',
  'MX_RECORD_VERIFICATION_CLAIM' : '{USER_EMAIL} claimed to verify the MX record for {DOMAIN_NAME}',
  'PLAY_FOR_WORK_ENROLL' : 'Enrolled for {PLAY_FOR_WORK_MDM_VENDOR_NAME} mobile device management services using token ({PLAY_FOR_WORK_TOKEN_ID})',
  'PLAY_FOR_WORK_UNENROLL' : 'Unenrolled from {PLAY_FOR_WORK_MDM_VENDOR_NAME} mobile device management services',
  'REGENERATE_OAUTH_CONSUMER_SECRET' : 'New OAuth consumer secret generated for your organization',
  'REMOVE_API_CLIENT_ACCESS' : 'API client access to your organization from client {API_CLIENT_NAME} removed',
  'REMOVE_APPLICATION' : 'Application {APPLICATION_NAME} with id {APP_ID} has been removed from the domain',
  'REMOVE_APPLICATION_FROM_WHITELIST' : 'Application {APPLICATION_NAME} with id {APP_ID} has been removed from whitelist for the domain',
  'REMOVE_DOMAIN_ALIAS' : '{DOMAIN_ALIAS} deleted as an alias of {DOMAIN_NAME}',
  'REMOVE_SECONDARY_DOMAIN' : '{SECONDARY_DOMAIN_NAME} deleted as a secondary domain of {DOMAIN_NAME}',
  'REMOVE_TRUSTED_DOMAINS' : 'Domains {DOMAIN_NAME} removed from Trusted Domains list',
  'RENAME_ALERT' : 'Alert {OLD_VALUE} has been renamed to {NEW_VALUE}',
  'RENAME_RULE' : 'Rule {OLD_VALUE} has been renamed to {NEW_VALUE}',
  'RULE_ACTIONS_CHANGED' : 'Rule actions for {RULE_NAME} changed',
  'RULE_STATUS_CHANGED' : 'Rule status for {RULE_NAME} changed from {OLD_VALUE} to {NEW_VALUE}',
  'SKIP_DOMAIN_ALIAS_MX' : 'Skipped MX record setup of alias {DOMAIN_ALIAS} of domain {DOMAIN_NAME}',
  'SKIP_SECONDARY_DOMAIN_MX' : 'Skipped MX record setup of secondary domain {SECONDARY_DOMAIN_NAME} of domain {DOMAIN_NAME}',
  'TOGGLE_ALLOW_ADMIN_PASSWORD_RESET' : 'Allow admin password reset setting changed to {NEW_VALUE}',
  'TOGGLE_AUTO_ADD_NEW_SERVICE' : 'Automatic addition for new services and pre-release features for your organization changed to {NEW_VALUE}',
  'TOGGLE_CONTACT_SHARING' : 'Contact sharing changed to {NEW_VALUE}',
  'TOGGLE_ENABLE_OAUTH_CONSUMER_KEY' : 'Enabling OAuth consumer key changed to {NEW_VALUE} for your organization',
  'TOGGLE_ENABLE_PRE_RELEASE_FEATURES' : 'Pre-release features for your organization was set to {NEW_VALUE}',
  'TOGGLE_NEW_APP_FEATURES' : 'New app features for your organization changed to {NEW_VALUE}',
  'TOGGLE_OAUTH_ACCESS_TO_ALL_APIS' : 'OAuth access for all APIs changed to {NEW_VALUE} for your organization',
  'TOGGLE_OPEN_ID_ENABLED' : 'OpenId federated login for {DOMAIN_NAME} changed to {NEW_VALUE}',
  'TOGGLE_OUTBOUND_RELAY' : 'Outbound relay for your organization changed to {NEW_VALUE}',
  'TOGGLE_SSL' : 'SSL Enforcement changed to {NEW_VALUE} for {DOMAIN_NAME}',
  'TOGGLE_SSO_ENABLED' : 'Enable SSO changed to {NEW_VALUE} for {DOMAIN_NAME}',
  'TOGGLE_USE_CUSTOM_LOGO' : 'Use custom logo changed to {NEW_VALUE}',
  'TOGGLE_USE_NEXT_GEN_CONTROL_PANEL' : 'The setting to enable the new Admin Console changed to {NEW_VALUE} for your organization',
  'UPDATE_DOMAIN_SECONDARY_EMAIL' : 'Secondary email for your organization changed from {OLD_VALUE} to {NEW_VALUE}',
  'UPDATE_RULE' : 'Rule {RULE_NAME} has been updated',
  'UPLOAD_OAUTH_CERTIFICATE' : 'New OAuth certificate uploaded for your organization',
  'VERIFY_DOMAIN_ALIAS' : '{DOMAIN_ALIAS} verified as an alias of {DOMAIN_NAME} using {DOMAIN_VERIFICATION_METHOD}',
  'VERIFY_DOMAIN_ALIAS_MX' : 'Verified MX record of alias {DOMAIN_ALIAS} of domain {DOMAIN_NAME}',
  'VERIFY_SECONDARY_DOMAIN' : '{SECONDARY_DOMAIN_NAME} verified as a secondary domain of {DOMAIN_NAME}',
  'VERIFY_SECONDARY_DOMAIN_MX' : 'Verified MX records of secondary domain {SECONDARY_DOMAIN_NAME} of domain {DOMAIN_NAME}',
  'VIEW_DNS_LOGIN_DETAILS' : 'DNS console login details for {DOMAIN_NAME} viewed',

  // admin: gmail
  'CHANGE_EMAIL_SETTING' : '{SETTING_NAME} for email service in your organization changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_GMAIL_SETTING' : 'Gmail setting {SETTING_NAME} was modified',
  'CREATE_GMAIL_SETTING' : 'New gmail setting {SETTING_NAME} was added',
  'DELETE_GMAIL_SETTING' : 'Gmail setting {SETTING_NAME} was deleted',
  'DROP_FROM_QUARANTINE' : 'A message with email message id of {EMAIL_LOG_SEARCH_MSG_ID} was dropped from the {QUARANTINE_NAME} quarantine.',
  'EMAIL_LIFE_OF_A_MESSAGE' : 'Email life of a message search description',
  'EMAIL_LOG_SEARCH' : 'An email log search is performed for logs from {EMAIL_LOG_SEARCH_START_DATE} to {EMAIL_LOG_SEARCH_END_DATE} with a sender of [{EMAIL_LOG_SEARCH_SENDER}], a recipient of [{EMAIL_LOG_SEARCH_RECIPIENT}], and an email message id of [{EMAIL_LOG_SEARCH_MSG_ID}]',
  'EMAIL_UNDELETE' : 'Email restoration from {START_DATE} to {END_DATE} initiated for {USER_EMAIL}',
  'REJECT_FROM_QUARANTINE' : 'A message with email message id of {EMAIL_LOG_SEARCH_MSG_ID} was rejected with the default reject message from the {QUARANTINE_NAME} quarantine.',
  'RELEASE_FROM_QUARANTINE' : 'A message with email message id of {EMAIL_LOG_SEARCH_MSG_ID} was released from the {QUARANTINE_NAME} quarantine.',

  // admin: groups
  'ADD_GROUP_MEMBER' : 'User {USER_EMAIL} created under group {GROUP_EMAIL}',
  'CHANGE_GROUP_DESCRIPTION' : 'Description for group {GROUP_EMAIL} changed',
  'CHANGE_GROUP_EMAIL' : 'Email of group {GROUP_EMAIL} changed to {NEW_VALUE}',
  'CHANGE_GROUP_NAME' : 'Name of group {GROUP_EMAIL} changed to {NEW_VALUE}',
  'CHANGE_GROUP_SETTING' : '{SETTING_NAME} for group {GROUP_EMAIL} changed from {OLD_VALUE} to {NEW_VALUE}',
  'CREATE_GROUP' : 'Group {GROUP_EMAIL} created',
  'DELETE_GROUP' : 'Group {GROUP_EMAIL} deleted',
  'GROUP_LIST_DOWNLOAD' : 'Group list was downloaded as a CSV file',
  'GROUP_MEMBER_BULK_UPLOAD' : 'A total of {GROUP_MEMBER_BULK_UPLOAD_TOTAL_NUMBER} members selected for upload. {GROUP_MEMBER_BULK_UPLOAD_FAILED_NUMBER} out of {GROUP_MEMBER_BULK_UPLOAD_TOTAL_NUMBER} members failed to be uploaded',
  'GROUP_MEMBERS_DOWNLOAD' : 'Group member list was downloaded as a CSV file',
  'REMOVE_GROUP_MEMBER' : 'User {USER_EMAIL} deleted from group {GROUP_EMAIL}',
  'UPDATE_GROUP_MEMBER' : 'Roles of the user {USER_EMAIL} in group {GROUP_EMAIL} updated from {OLD_VALUE} to {NEW_VALUE}',
  'UPDATE_GROUP_MEMBER_DELIVERY_SETTINGS' : 'DeliverySettings of the user {USER_EMAIL} in group {GROUP_EMAIL} updated from {OLD_VALUE} to {NEW_VALUE}',
  'UPDATE_GROUP_MEMBER_DELIVERY_SETTINGS_CAN_EMAIL_OVERRIDE' : 'DeliverySettings Email Override of the user {USER_EMAIL} in group {GROUP_EMAIL} updated from {OLD_VALUE} to {NEW_VALUE}',
  'WHITELISTED_GROUPS_UPDATED' : 'Filtering groups updated to {WHITELISTED_GROUPS}',

  // admin: licenses
  'CHANGE_LICENSE_AUTO_ASSIGN' : 'License Auto Assign option changed to {NEW_VALUE} for {PRODUCT_NAME} product and {SKU_NAME} sku',
  'CHROME_APP_LICENSES_ENABLED' : 'App license policy for {APPLICATION_NAME} at {DISTRIBUTION_ENTITY_NAME} {DISTRIBUTION_ENTITY_TYPE} is now {CHROME_LICENSES_ENABLED}',
  'CHROME_APP_USER_LICENSE_ASSIGNED' : 'License {APP_LICENSE} is assigned to {USER_EMAIL}',
  'CHROME_APP_USER_LICENSE_REVOKED' : 'License {APP_LICENSE} is revoked for {USER_EMAIL}',
  'FIRST_TEMPORARY_OR_SUPPRESSED_LICENSE_NOTIFICATION' : 'An email is sent for the creation of first temporary or suppressed license for {SKU_NAME} sku',
  'ORG_ALL_USERS_LICENSE_ASSIGNMENT' : 'Licenses for {PRODUCT_NAME} product and {NEW_VALUE} sku were assigned to all users of {ORG_UNIT_NAME}',
  'ORG_LICENSE_REVOKE' : 'Licenses for {PRODUCT_NAME} product and {OLD_VALUE} sku were removed from assigned users of {ORG_UNIT_NAME}',
  'ORG_USERS_LICENSE_ASSIGNMENT' : 'Licenses for {PRODUCT_NAME} product and {NEW_VALUE} sku were assigned to all unassigned users of {ORG_UNIT_NAME}',
  'RESELLER_FIRST_TEMPORARY_OR_SUPPRESSED_LICENSE_NOTIFICATION' : 'An email is sent as the user {DOMAIN_NAME} has been assigned temporary or suppressed license for {SKU_NAME} sku',
  'RESELLER_TEMPORARY_LICENSES_EXPIRED_NOTIFICATION' : 'An email is sent as the temporary licenses for {SKU_NAME} sku are expired for user {DOMAIN_NAME}',
  'SUPPRESSED_LICENSE_ASSIGNMENT' : 'A suppressed license for {PRODUCT_NAME} product and {NEW_VALUE} sku was assigned to the user {USER_EMAIL}',
  'SUPPRESSED_LICENSE_REVOKE' : 'A suppressed license for {PRODUCT_NAME} product and {OLD_VALUE} sku was revoked from the user {USER_EMAIL}',
  'SUPPRESSED_TO_ASSIGNED_LICENSE_CONVERSION' : 'Suppressed license of the user {USER_EMAIL} for {PRODUCT_NAME} product and {NEW_VALUE} sku was converted to Active',
  'TEMPORARY_LICENSE_ASSIGNMENT' : 'A temporary license for {PRODUCT_NAME} product and {NEW_VALUE} sku was assigned to the user {USER_EMAIL}',
  'TEMPORARY_LICENSE_REVOKE' : 'A temporary license for {PRODUCT_NAME} product and {OLD_VALUE} sku was revoked from the user {USER_EMAIL}',
  'TEMPORARY_LICENSES_EXPIRED_NOTIFICATION' : 'An email is sent for the expiration of temporary licenses for {SKU_NAME} sku',
  'TEMPORARY_TO_ASSIGNED_LICENSE_CONVERSION' : 'Temporary license of the user {USER_EMAIL} for {PRODUCT_NAME} product and {NEW_VALUE} sku was converted to Active',
  'TEMPORARY_TO_SUPPRESSED_LICENSE_CONVERSION' : 'Temporary license of the user {USER_EMAIL} for {PRODUCT_NAME} product and {NEW_VALUE} sku was expired and converted to Suppressed',
  'UPDATE_DYNAMIC_LICENSE' : 'Auto Licensing settings for {PRODUCT_NAME} product in {ORG_UNIT_NAME} organization changed from {OLD_VALUE} to {NEW_VALUE}',
  'USER_LICENSE_ASSIGNMENT' : 'A license for {PRODUCT_NAME} product and {NEW_VALUE} sku was assigned to the user {USER_EMAIL}',
  'USER_LICENSE_REASSIGNMENT' : 'A license for {PRODUCT_NAME} product and {OLD_VALUE} sku was reassigned for user {USER_EMAIL} to new sku {NEW_VALUE}',
  'USER_LICENSE_REVOKE' : 'A license for {PRODUCT_NAME} product and {OLD_VALUE} sku was revoked from user {USER_EMAIL}',

  // admin: organization
  'ASSIGN_CUSTOM_LOGO' : 'New custom logo assigned for org unit {ORG_UNIT_NAME}',
  'CHROME_APPLICATION_LICENSE_RESERVATION_CREATED' : '{NEW_VALUE} app licenses reserved to {ORG_UNIT_NAME} for {APPLICATION_NAME} {SKU_NAME}',
  'CHROME_APPLICATION_LICENSE_RESERVATION_DELETED' : 'App license reservation at {ORG_UNIT_NAME} for {APPLICATION_NAME} {SKU_NAME} deleted',
  'CHROME_APPLICATION_LICENSE_RESERVATION_UPDATED' : 'App license reservation at {ORG_UNIT_NAME} for {APPLICATION_NAME} {SKU_NAME} updated from {OLD_VALUE} to {NEW_VALUE} licenses',
  'CHROME_LICENSES_ALLOWED' : 'Licenses allowed policy is {CHROME_LICENSES_ALLOWED} for app {APPLICATION_NAME} at org unit {ORG_UNIT_NAME}',
  'CHROME_LICENSES_ENABLED' : 'App license policy for {APPLICATION_NAME} at org unit {ORG_UNIT_NAME} is now {CHROME_LICENSES_ENABLED}',
  'CREATE_DEVICE_ENROLLMENT_TOKEN' : 'Generated a new enrollment token for {FULL_ORG_UNIT_PATH}',
  'CREATE_ENROLLMENT_TOKEN' : 'A new enrollment token is generated for {ORG_UNIT_NAME}',
  'CREATE_ORG_UNIT' : 'Org Unit {ORG_UNIT_NAME} created',
  'EDIT_ORG_UNIT_DESCRIPTION' : 'Description of {ORG_UNIT_NAME} changed',
  'EDIT_ORG_UNIT_NAME' : 'Name of {ORG_UNIT_NAME} changed to {NEW_VALUE}',
  'MOVE_ORG_UNIT' : '{ORG_UNIT_NAME} moved to parent {NEW_VALUE}',
  'REMOVE_ORG_UNIT' : 'Org Unit {ORG_UNIT_NAME} deleted',
  'REVOKE_DEVICE_ENROLLMENT_TOKEN' : 'Revoked the enrollment token of {FULL_ORG_UNIT_PATH}',
  'REVOKE_ENROLLMENT_TOKEN' : 'The enrollment token of {ORG_UNIT_NAME} has been revoked',
  'TOGGLE_SERVICE_ENABLED' : 'Service {SERVICE_NAME} changed to {NEW_VALUE} for {ORG_UNIT_NAME} organizational unit in your organization',
  'UNASSIGN_CUSTOM_LOGO' : 'Custom logo unassigned for org unit {ORG_UNIT_NAME}',
  
  // admin: security
  'ADD_TO_BLOCKED_OAUTH2_APPS' : '{OAUTH2_APP_NAME} added to Blocked list for {ORG_UNIT_NAME}',
  'ADD_TO_CAA_EXEMPT_OAUTH2_APPS' : '{OAUTH2_APP_NAME} allowlisted for exemption from API access blocks for {ORG_UNIT_NAME}',
  'ADD_TO_LIMITED_OAUTH2_APPS' : '{OAUTH2_APP_NAME} added to Limited list for {ORG_UNIT_NAME}',
  'ADD_TO_TRUSTED_BY_OAUTH_SCOPE_OAUTH2_APPS' : '{OAUTH2_APP_NAME} added to trusted by OAuth scope list for {ORG_UNIT_NAME}',
  'ADD_TO_TRUSTED_OAUTH2_APPS' : '{OAUTH2_APP_NAME} trusted for {ORG_UNIT_NAME}',
  'ALLOW_SERVICE_FOR_OAUTH2_ACCESS' : '{OAUTH2_SERVICE_NAME} API Access is allowed for {ORG_UNIT_NAME}',
  'ALLOW_STRONG_AUTHENTICATION' : 'Allow 2-Step Verification has been set from {OLD_VALUE} to {NEW_VALUE} for {DOMAIN_NAME}',
  'BLOCK_ALL_THIRD_PARTY_API_ACCESS' : 'All third party API Access blocked',
  'BLOCK_ON_DEVICE_ACCESS' : 'Block on device {OAUTH2_SERVICE_NAME} access for {ORG_UNIT_NAME}',
  'CHANGE_ALLOWED_TWO_STEP_VERIFICATION_METHODS' : '2-step verification allowed 2-step verification methods for {ORG_UNIT_NAME} changed to {ALLOWED_TWO_STEP_VERIFICATION_METHOD}',
  'CHANGE_APP_ACCESS_SETTINGS_COLLECTION_ID' : 'App Access Settings Collection for the org unit {ORG_UNIT_NAME} has changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_CAA_APP_ASSIGNMENTS' : 'For {TARGET_ENTITY_TYPE} [{TARGET_ENTITY_NAME}]: Before: Access level [{CAA_ACCESS_ASSIGNMENTS_OLD}] applied to {CAA_ENFORCEMENT_ENDPOINTS_OLD} of [{APPLICATION_NAME}] in [{MODE}] mode. After: Access level [{CAA_ACCESS_ASSIGNMENTS_NEW}] applied to {CAA_ENFORCEMENT_ENDPOINTS_NEW} of [{APPLICATION_NAME}] in [{MODE}] mode.',
  'CHANGE_CAA_ERROR_MESSAGE' : 'Error message has been changed to [{NEW_VALUE}]. (OrgUnit Name: {ORG_UNIT_NAME})',
  'CHANGE_SESSION_LENGTH' : 'Session length has been changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_TWO_STEP_VERIFICATION_ENROLLMENT_PERIOD_DURATION' : '2-step verification enrollment period duration for {ORG_UNIT_NAME} changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_TWO_STEP_VERIFICATION_FREQUENCY' : '2-step verification frequency for {ORG_UNIT_NAME} changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_TWO_STEP_VERIFICATION_GRACE_PERIOD_DURATION' : '2-step verification grace period duration for {ORG_UNIT_NAME} changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_TWO_STEP_VERIFICATION_START_DATE' : '2-step verification start date has been changed from {OLD_VALUE} to {NEW_VALUE}',
  'DISALLOW_SERVICE_FOR_OAUTH2_ACCESS' : '{OAUTH2_SERVICE_NAME} API Access is blocked for {ORG_UNIT_NAME}',
  'DOWNLOAD_PENDING_APP_USER_REQUESTS' : 'Downloaded list of users requesting access to {OAUTH2_APP_NAME}',
  'EDU_DELEGATED_USER_APPROVAL_WORKFLOW_DISABLED' : 'Disabled over 18 users making delegated apps requests for {ORG_UNIT_NAME}',
  'EDU_DELEGATED_USER_APPROVAL_WORKFLOW_ENABLED' : 'Enabled over 18 users making delegated apps requests for {ORG_UNIT_NAME}',
  'EDU_OVER_18_APPROVAL_WORKFLOW_DISABLED' : 'Disabled Edu over 18 users apps requests for {ORG_UNIT_NAME}',
  'EDU_OVER_18_APPROVAL_WORKFLOW_ENABLED' : 'Enabled Edu over 18 users apps requests for {ORG_UNIT_NAME}',
  'ENABLE_NON_ADMIN_USER_PASSWORD_RECOVERY' : 'Enable non-admin user password recovery setting in {ORG_UNIT_NAME} organization changed from {OLD_VALUE} to {NEW_VALUE}',
  'ENFORCE_STRONG_AUTHENTICATION' : '{SETTING_NAME} in security settings for your organization changed from {OLD_VALUE} to {NEW_VALUE}',
  'MULTIPLE_ADD_TO_BLOCKED_OAUTH2_APPS' : '{OAUTH2_NUM_APPS} apps added to Blocked list for {ORG_UNIT_NAME}',
  'MULTIPLE_ADD_TO_LIMITED_OAUTH2_APPS' : '{OAUTH2_NUM_APPS} apps added to Limited list for {ORG_UNIT_NAME}',
  'MULTIPLE_ADD_TO_TRUSTED_BY_OAUTH_SCOPE_OAUTH2_APPS' : '{OAUTH2_NUM_APPS} apps added to Trusted by OAuth Scope list for {ORG_UNIT_NAME}',
  'MULTIPLE_ADD_TO_TRUSTED_OAUTH2_APPS' : '{OAUTH2_NUM_APPS} apps added to Trusted list for {ORG_UNIT_NAME}',
  'OAUTH_APPS_BULK_UPLOAD' : '{BULK_UPLOAD_SUCCESS_OAUTH_APPS_NUMBER} of {BULK_UPLOAD_TOTAL_OAUTH_APPS_NUMBER} rows successfully uploaded',
  'OAUTH_APPS_BULK_UPLOAD_NOTIFICATION_SENT' : 'Notification of bulk upload for apps list sent to {USER_EMAIL}',
  'REMOVE_FROM_BLOCKED_OAUTH2_APPS' : '{OAUTH2_APP_NAME} removed from Blocked list for {ORG_UNIT_NAME}',
  'REMOVE_FROM_CAA_EXEMPT_OAUTH2_APPS' : '{OAUTH2_APP_NAME} removed from allowlist for exemption from API access blocks for {ORG_UNIT_NAME}',
  'REMOVE_FROM_LIMITED_OAUTH2_APPS' : '{OAUTH2_APP_NAME} removed from Limited list for {ORG_UNIT_NAME}',
  'REMOVE_FROM_TRUSTED_BY_OAUTH_SCOPE_OAUTH2_APPS' : '{OAUTH2_APP_NAME} removed from trusted by OAuth scope list for {ORG_UNIT_NAME}',
  'REMOVE_FROM_TRUSTED_OAUTH2_APPS' : '{OAUTH2_APP_NAME} no longer trusted for {ORG_UNIT_NAME}',
  'SESSION_CONTROL_SETTINGS_CHANGE' : 'Session Control Settings updated for {REAUTH_APPLICATION} from {REAUTH_SETTING_OLD} to {REAUTH_SETTING_NEW}. (OrgUnit Name: {ORG_UNIT_NAME})',
  'SIGN_IN_ONLY_THIRD_PARTY_API_ACCESS' : 'Allow Google Sign-in only third party API access',
  'TOGGLE_CAA_ENABLEMENT' : 'Context Aware Access has been {NEW_VALUE}.',
  'TOGGLE_CAA_REMEDIATION_ENABLEMENT' : 'Context Aware Access Remediation has been {NEW_VALUE}. (OrgUnit Name: {ORG_UNIT_NAME})',
  'TRUST_DOMAIN_OWNED_OAUTH2_APPS' : 'Domain Owned Apps added to trusted list',
  'UNBLOCK_ALL_THIRD_PARTY_API_ACCESS' : 'All third party API Access unblocked',
  'UNBLOCK_ON_DEVICE_ACCESS' : 'Unblock on device {OAUTH2_SERVICE_NAME} access for {ORG_UNIT_NAME}',
  'UNDERAGE_BLOCK_ALL_THIRD_PARTY_API_ACCESS' : 'All access to unconfigured third-party apps blocked for users under 18 for {ORG_UNIT_NAME}',
  'UNDERAGE_SIGN_IN_ONLY_THIRD_PARTY_API_ACCESS' : 'Allow Google Sign-in only access to unconfigured third-party apps for users under 18 for {ORG_UNIT_NAME}',
  'UNDERAGE_USER_APPROVAL_WORKFLOW_DISABLED' : 'Disabled under 18 users apps requests for {ORG_UNIT_NAME}',
  'UNDERAGE_USER_APPROVAL_WORKFLOW_ENABLED' : 'Enabled under 18 users apps requests for {ORG_UNIT_NAME}',
  'UNTRUST_DOMAIN_OWNED_OAUTH2_APPS' : 'Domain Owned Apps removed from trusted list',
  'UPDATE_ERROR_MSG_FOR_RESTRICTED_OAUTH2_APPS' : 'Error message for restricted OAuth2 apps for your organization updated from {OLD_VALUE} to {NEW_VALUE}',
  'USER_APPROVAL_WORKFLOW_DISABLED' : 'Disabled users over 18 to make apps requests for {ORG_UNIT_NAME}',
  'USER_APPROVAL_WORKFLOW_ENABLED' : 'Enabled users over 18 to make apps requests for {ORG_UNIT_NAME}',
  'WEAK_PROGRAMMATIC_LOGIN_SETTINGS_CHANGED' : 'Setting changed for {ORG_UNIT_NAME} organization unit from {OLD_VALUE} to {NEW_VALUE}',

  // admin: user
  'ACCEPT_USER_INVITATION' : 'User invitation accepted for user: {USER_EMAIL}',
  'ADD_DISPLAY_NAME' : '{USER_DISPLAY_NAME} added as a display name of {USER_EMAIL}',
  'ADD_NICKNAME' : '{USER_NICKNAME} created as a nickname of {USER_EMAIL}',
  'ADD_RECOVERY_EMAIL' : 'Recovery email added for {USER_EMAIL}',
  'ADD_RECOVERY_PHONE' : 'Recovery phone added for {USER_EMAIL}',
  'ARCHIVE_USER' : '{USER_EMAIL} archived',
  'BULK_UPLOAD' : '{BULK_UPLOAD_TOTAL_USERS_NUMBER} users selected for upload to your organization. {BULK_UPLOAD_FAIL_USERS_NUMBER} out of {BULK_UPLOAD_TOTAL_USERS_NUMBER} users were not uploaded.',
  'BULK_UPLOAD_NOTIFICATION_SENT' : 'Notification of bulk users upload sent to {USER_EMAIL}',
  'CANCEL_USER_INVITE' : 'Invite to {USER_EMAIL} cancelled',
  'CHANGE_DISPLAY_NAME' : 'Display name of {USER_EMAIL} changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_FIRST_NAME' : 'First name of {USER_EMAIL} changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_LAST_NAME' : 'Last name of {USER_EMAIL} changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_PASSWORD' : 'Password changed for {USER_EMAIL}',
  'CHANGE_PASSWORD_ON_NEXT_LOGIN' : 'Password change requirement for {USER_EMAIL} on next login changed from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_RECOVERY_EMAIL' : 'Recovery email changed for {USER_EMAIL}',
  'CHANGE_RECOVERY_PHONE' : 'Recovery phone changed for {USER_EMAIL}',
  'CHANGE_USER_ADDRESS' : 'Addresses changed for {USER_EMAIL} from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_USER_CUSTOM_FIELD' : '{USER_CUSTOM_FIELD} changed for {USER_EMAIL} from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_USER_EXTERNAL_ID' : 'External Ids changed for {USER_EMAIL} from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_USER_GENDER' : 'Gender changed for {USER_EMAIL} from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_USER_IM' : 'IMs changed for {USER_EMAIL} from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_USER_KEYWORD' : 'Keywords changed for {USER_EMAIL} from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_USER_LANGUAGE' : 'Languages changed for {USER_EMAIL} from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_USER_LOCATION' : 'Locations changed for {USER_EMAIL} from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_USER_ORGANIZATION' : 'Organizations changed for {USER_EMAIL} from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_USER_PHONE_NUMBER' : 'Phone Numbers changed for {USER_EMAIL} from {OLD_VALUE} to {NEW_VALUE}',
  'CHANGE_USER_RELATION' : 'Relations changed for {USER_EMAIL} from {OLD_VALUE} to {NEW_VALUE}',
  'CREATE_DATA_TRANSFER_REQUEST' : 'Data transfer request created from {USER_EMAIL} to {DESTINATION_USER_EMAIL} for apps {APPLICATION_NAME}',
  'CREATE_EMAIL_MONITOR' : 'Created an email monitor for {USER_EMAIL} to {EMAIL_MONITOR_DEST_EMAIL} that will expire on {END_DATE_TIME}',
  'CREATE_USER' : '{USER_EMAIL} created',
  'DELETE_2SV_SCRATCH_CODES' : '2-step verification scratch codes of the user {USER_EMAIL} deleted',
  'DELETE_ACCOUNT_INFO_DUMP' : 'Deleted account and login information dump for {USER_EMAIL} and request ID {REQUEST_ID}',
  'DELETE_EMAIL_MONITOR' : 'Deleted an email monitor for {USER_EMAIL} to {EMAIL_MONITOR_DEST_EMAIL}',
  'DELETE_MAILBOX_DUMP' : 'Deleted mailbox dump for {USER_EMAIL} and request ID {REQUEST_ID}',
  'DELETE_PROFILE_PHOTO' : 'Profile photo of {USER_EMAIL} has been deleted',
  'DELETE_USER' : '{USER_EMAIL} deleted',
  'DOWNGRADE_USER_FROM_GPLUS' : '{USER_EMAIL} was downgraded from Google+',
  'DOWNLOAD_PENDING_INVITES_LIST' : 'Pending Invites List was downloaded as a CSV file',
  'DOWNLOAD_UNMANAGED_USERS_LIST' : 'Unmanaged Users list was downloaded as a CSV file',
  'DOWNLOAD_USERLIST' : 'User list was downloaded in {FORMAT}',
  'DOWNLOAD_USERLIST_CSV' : 'User list was downloaded as a CSV file',
  'ENABLE_USER_IP_WHITELIST' : 'IP whitelist changed for {USER_EMAIL} from {OLD_VALUE} to {NEW_VALUE}',
  'GENERATE_2SV_SCRATCH_CODES' : 'New 2-step verification scratch codes generated for the user {USER_EMAIL}',
  'GMAIL_RESET_USER' : 'Gmail account of {USER_EMAIL} reset',
  'GRANT_ADMIN_PRIVILEGE' : 'Admin privileges granted to {USER_EMAIL}',
  'GRANT_DELEGATED_ADMIN_PRIVILEGES' : '{USER_EMAIL} assigned {NEW_VALUE} admin privileges',
  'MAIL_ROUTING_DESTINATION_ADDED' : 'User {USER_EMAIL} has received the following individual mail routing destination: {NEW_VALUE}',
  'MAIL_ROUTING_DESTINATION_REMOVED' : 'User {USER_EMAIL} has had the following individual mail routing destination removed: {OLD_VALUE}',
  'MOVE_USER_TO_ORG_UNIT' : '{USER_EMAIL} moved from {ORG_UNIT_NAME} to {NEW_VALUE}',
  'PASSKEY_REVOKED' : 'A passkey enrolled for user {USER_EMAIL} was revoked',
  'REMOVE_DISPLAY_NAME' : '{USER_DISPLAY_NAME} removed as a display name of {USER_EMAIL}',
  'REMOVE_NICKNAME' : '{USER_NICKNAME} deleted as a nickname of {USER_EMAIL}',
  'REMOVE_RECOVERY_EMAIL' : 'Recovery email removed for {USER_EMAIL}',
  'REMOVE_RECOVERY_PHONE' : 'Recovery phone removed for {USER_EMAIL}',
  'RENAME_USER' : '{USER_EMAIL} renamed to {NEW_VALUE}',
  'REQUEST_ACCOUNT_INFO' : 'Requested account and login information for {USER_EMAIL}',
  'REQUEST_MAILBOX_DUMP' : 'Requested mailbox dump for {USER_EMAIL}',
  'RESEND_USER_INVITE' : 'Invite email to {USER_EMAIL} resent',
  'RESET_SIGNIN_COOKIES' : 'Cookies reset for {USER_EMAIL} and forced re-login',
  'REVOKE_3LO_DEVICE_TOKENS' : '3-legged OAuth tokens issued by user {USER_EMAIL} for the device type {DEVICE_TYPE} and id {DEVICE_ID} were revoked',
  'REVOKE_3LO_TOKEN' : '3-legged OAuth tokens issued by user {USER_EMAIL} for application {APP_ID} were revoked',
  'REVOKE_ADMIN_PRIVILEGE' : 'Admin privileges revoked from {USER_EMAIL}',
  'REVOKE_ASP' : 'Application specific password with Id {ASP_ID} issued by user {USER_EMAIL} revoked',
  'REVOKE_SECURITY_KEY' : 'A security key enrolled for user {USER_EMAIL} for 2-step verification was revoked',
  'SECURITY_KEY_REGISTERED_FOR_USER' : 'Security key registered for {USER_EMAIL}',
  'SUSPEND_USER' : '{USER_EMAIL} suspended',
  'TOGGLE_AUTOMATIC_CONTACT_SHARING' : 'Automatic contact sharing for {USER_EMAIL} changed to {NEW_VALUE}',
  'TURN_OFF_2_STEP_VERIFICATION' : '2-step verification has been turned off for the user {USER_EMAIL}',
  'UNARCHIVE_USER' : '{USER_EMAIL} unarchived',
  'UNBLOCK_USER_SESSION' : 'User {USER_EMAIL} unblocked by temporarily disabling login challenge',
  'UNDELETE_USER' : '{USER_EMAIL} undeleted',
  'UNENROLL_USER_FROM_STRONG_AUTH' : 'User {USER_EMAIL} unenrolled from Strong Auth',
  'UNENROLL_USER_FROM_TITANIUM' : 'User {USER_EMAIL} unenrolled from Advanced Protection',
  'UNMANAGED_USERS_BULK_UPLOAD' : 'A total of {BULK_UPLOAD_TOTAL_USERS_NUMBER} unmanaged users selected for upload. {BULK_UPLOAD_FAIL_USERS_NUMBER} out of {BULK_UPLOAD_TOTAL_USERS_NUMBER} users failed to be uploaded.',
  'UNSUSPEND_USER' : '{USER_EMAIL} unsuspended',
  'UPDATE_BIRTHDATE' : 'The birth date for {USER_EMAIL} changed to {BIRTHDATE}',
  'UPDATE_PROFILE_PHOTO' : 'Profile photo of {USER_EMAIL} has been updated',
  'UPDATE_PUBLIC_KEY_CERTIFICATE' : 'Public key certificate updated for {USER_DISPLAY_NAME} email {USER_EMAIL}',
  'UPDATE_PUBLIC_KEY_CERTIFICATE_STATUS' : 'Public key certificate status updated to {PUBLIC_KEY_CERTIFICATE_STATUS} for email {USER_IMPACTED_EMAIL} of user {USER_EMAIL}',
  'UPGRADE_USER_TO_GPLUS' : '{USER_EMAIL} was upgraded to Google+',
  'USER_CREATED_PASSKEY_REVOKE' : 'A user created passkey enrolled for user {USER_EMAIL} was revoked',
  'USER_ENROLLED_IN_TWO_STEP_VERIFICATION' : '{USER_EMAIL} enrolled in 2-step verification',
  'USER_INVITE' : '{USER_EMAIL} invited to join your organization',
  'USER_PUT_IN_TWO_STEP_VERIFICATION_GRACE_PERIOD' : '2-step verification grace period has been enabled on {USER_EMAIL} till {NEW_VALUE}',
  'USERS_BULK_UPLOAD' : 'A total of {BULK_UPLOAD_TOTAL_USERS_NUMBER} users selected for upload. {BULK_UPLOAD_FAIL_USERS_NUMBER} out of {BULK_UPLOAD_TOTAL_USERS_NUMBER} users failed to be uploaded.',
  'USERS_BULK_UPLOAD_NOTIFICATION_SENT' : 'Notification of bulk users upload sent to {USER_EMAIL}',
  'VIEW_TEMP_PASSWORD' : 'Temporary password for user {USER_EMAIL} viewed by the admin',
};
// The more elegant function to convert `event` into a description string based on https://developers.google.com/workspace/admin/reports/v1/appendix/activity/admin-user-settings
function getEventDescription(event){
  const eventName = event.name;
  let constructedEventDescription = EVENT_DESCRIPTIONS[eventName];
  if (!constructedEventDescription){
    return `Unknown Event: ${event}`;
  }
  const eventParams = event.parameters;
  if (eventParams){
    eventParams.forEach(param => {
      const placeholder = `{${param.name}}`;
      const value = param.value || param.multiValue;
      constructedEventDescription = constructedEventDescription.replace(placeholder, value);
    });
  }
  return constructedEventDescription;

}

function GetAdminLogEventsSevenDays() {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startTime = oneWeekAgo.toISOString();
  const endTime = now.toISOString();

  const rows = [];
  let pageToken;
  let page;
  do {
    page = AdminReports.Activities.list('all', 'admin', {
      startTime: startTime,
      endTime: endTime,
      maxResults: 500,
      pageToken: pageToken
    });
    const items = page.items;
    if (items) {
      for (const item of items) {
        const row = {
          "date":new Date(item.id.time),
          "actor":item.actor.email,
          "name":item.events[0].name,
          "description":getEventDescription(item.events[0]),
          "type":item.events[0].type
        };
        rows.push(row);
      }
    }
    pageToken = page.nextPageToken;
  } while (pageToken);

  
  // do processing with sending email etc

  // first - sort the rows into asc order
  rows.sort((a,b) => a.date - b.date);
  // now build output
  emailContent = "<h1>Admin Log Events, last 7 days</h1>"
  Logger.log(rows.length);
  if (rows.length > 0){
    emailContent += "<table> <tr> <th style='border-bottom: 1px solid black'>Event</th> <th style='border-bottom: 1px solid black'>Actor</th> <th style='border-bottom: 1px solid black'>Date</th> <th style='border-bottom: 1px solid black'>Description</th> </tr>";
    for (let i=0; i<rows.length; i++){
      let rowToAppend = `<tr><td style='border-bottom: 1px solid black'>${rows[i].type}: ${rows[i].name}</td> <td style='border-bottom: 1px solid black'>${rows[i].actor}</td> <td style='border-bottom: 1px solid black'>${rows[i].date.toISOString()}</td> <td style='border-bottom: 1px solid black'>${rows[i].description}</td></tr>`;
      emailContent += rowToAppend  
    }
    emailContent += "</table>";
  } else{
    emailContent += "No records found."
  }
    emailContent += `<p style='font-size:0.7em'>Generated at ${new Date(Date.now())} by GetAdminLogEventsSevenDays Script</p>`

  
  MailApp.sendEmail({
    to: 'EMAIL_TO_SEND_TO',
    subject: '[AUD-GW] Admin Log Events from Last 7 Days',
    htmlBody: emailContent
    
  });
}