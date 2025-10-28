# UpdateUserAttributes 

Google Apps Script which updates the following user attributes within Google Admin:
* Job Title
* Type of Employee
* Manager
* Department
* Phone (Work)
* Address (Work)

Would be reasonably simple to add more attributes if needed, but this is all I need it for.

Needs a Google Sheet adding with the following Columns:
* A - READ ONLY Primary Email
* B - READ ONLY First Name
* C - READ ONLY Surname
* D - Job Title
* E - Type of Employee
* F - Manager
* G - Department
* H - Phone (Work)
* I - Address (Work)

Use the sheet `data` for the script. Have a second sheet for mangling the data in so you don't accidentally set it off.