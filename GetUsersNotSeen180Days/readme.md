# GetUsersNotSeen180Days

Emails a list of all users not seen in the last 180 days (by this, we mean if the `lastLoginTime` attribute is greater than 180 days ago).

Useful for figuring out if accounts are actively being used or if they should be left out to pasture.

Requires the `AdminDirectory` in Directory flavour. 