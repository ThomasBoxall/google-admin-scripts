/**
GetAdminLogEventsSevenDays - Audit script to email people with a list of admin audit events within the last 7 days. Used to audit whats going on in the Google Workspace.

SCHEDULED TRIGGER to run time-based, weekly, Midnight to 1am on a Monday

**/

function getDescriptionFromEvent(event) {
  // Returns description for event, assuming I've built a description return for it. 
  // Else - returns the entire event.

  // keep the cases alphabetical :)
  switch (event.name){
    case 'ADD_GROUP_MEMBER':
      let groupNameParam = event.parameters.find(x => x.name == 'GROUP_EMAIL');
      let userEmailParam = event.parameters.find(x => x.name == 'USER_EMAIL');
      return `Added ${userEmailParam.value} to group ${groupNameParam.value}`;
      break;
    case 'ALERT_CENTER_VIEW':
      return `Alert Centre Viewed`;
      break;
    case 'CHANGE_PASSWORD':
      let chPwUserEmail = event.parameters.find(x => x.name == 'USER_EMAIL');
      return `Changed password for ${chPwUserEmail.value}`
      break;
    case 'CHANGE_USER_LANGUAGE':
      let chLgwEmail = event.parameters.find(x => x.name == 'USER_EMAIL');
      let oldLang = event.parameters.find(x => x.name == 'OLD_VALUE');
      let newLang = event.parameters.find(x => x.name == 'NEW_VALUE');
      return `Language changed for ${chLgwEmail.value} from ${oldLang.value} to ${newLang.value}`;
      break;
    case 'CREATE_GROUP':
      let newGroupName = event.parameters.find(x => x.name == 'GROUP_EMAIL');
      return `Created group ${newGroupName.value}`;
      break;
    case 'CREATE_ORG_UNIT':
      let newUnitName = event.parameters.find(x => x.name == 'ORG_UNIT_NAME');
      return `Created Organisational Unit ${newUnitName.value}`;
      break;
    case 'CREATE_USER':
      let newUserEmail = event.parameters.find(x => x.name == 'USER_EMAIL');
      return `Created user ${newUserEmail.value}`;
      break;
    case 'EDIT_ORG_UNIT_DESCRIPTION':
      let newDescription = event.parameters.find(x => 'ORG_UNIT_NAME');
      return `Updated description of Organisational Unit to ${newDescription.value}`;
      break;
    case 'EDIT_ORG_UNIT_NAME':
      let oldName = event.parameters.find(x => x.name == 'ORG_UNIT_NAME');
      let newName = event.parameters.find(x => x.name == 'NEW_VALUE');
      return `Renamed Organisational Unit ${oldName.value} to ${newName.value}`;
      break;
    case 'MOVE_ORG_UNIT':
      let movedOrgUnit = event.parameters.find(x => x.name == 'ORG_UNIT_NAME');
      let newLoc = event.parameters.find(x => x.name == 'NEW_VALUE');
      return `Moved Organisational Unit ${movedOrgUnit.value} to ${newLoc.value}`;
      break;
    case 'MOVE_USER_TO_ORG_UNIT':
      let movedUsersEmail = event.parameters.find(x => x.name == 'USER_EMAIL');
      let oldOrgUnit = event.parameters.find(x => x.name == 'ORG_UNIT_NAME');
      let newOrgUnit = event.parameters.find(x => x.name == 'NEW_VALUE');
      return `${movedUsersEmail.value} moved from ${oldOrgUnit.value} to ${newOrgUnit.value}`;
      break;
    case 'REMOVE_GROUP_MEMBER':
      let removedUserEmail = event.parameters.find(x => x.name == 'USER_EMAIL');
      let removedFromGroup = event.parameters.find(x => x.name == 'GROUP_EMAIL');
      return `Removed ${removedUserEmail.value} from ${removedFromGroup.value}`;
      break;
    case 'REMOVE_ORG_UNIT':
      let orgUnitName = event.parameters.find(x => x.name == 'ORG_UNIT_NAME');
      return `Deleted Organisational Unit ${orgUnitName.value}`;
      break;
    case 'SECURITY_INVESTIGATION_QUERY':
      let dataSource = event.parameters.find(x => x.name == 'INVESTIGATION_DATA_SOURCE');
      let investigationQuery = event.parameters.find(x => x.name == 'INVESTIGATION_QUERY');
      return `Queried ${dataSource.value} for "${investigationQuery.value}"`;
      break;
    case 'SUSPEND_USER':
      let suspendedUserEmail = event.parameters.find(x => x.name == 'USER_EMAIL')
      return `Suspended user ${suspendedUserEmail.value}`;
      break;
    default:
      return `Unprogrammed Event Type: ${event}`;
      break;
  }
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
          "description":getDescriptionFromEvent(item.events[0]),
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