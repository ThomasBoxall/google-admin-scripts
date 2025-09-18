# GetGroupsStateOfNation

A simple Google Apps Script which populates a spreadsheet with the information relating to all groups in the GW Tennant.

## Config
- Add AdminDirectory flavour of Admin SDK API to the AppsScript Project
- Have a spreadsheet with a sheet called `output`, put the ID of this into the var in the code.

## Possible Extensions
- last email received by the group (currently Google doesn't publish this by Groups API so there would need to go through the Email Log Search API)
- get names of users and/or state of users who are within the domain and add this to the Owner, Manager & Members columns. 