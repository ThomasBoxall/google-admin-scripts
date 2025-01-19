/**
GetUsersNotSeen180Days - Audit script to generate a list of users who haven't logged in during the last 180 days. Used for auditing account use and identifying potential accounts for deletion.

SCHEDULED TRIGGER to run time-based, monthly, Midnight to 1am on the 1st of each month.

**/

function getUsersNotSeen180Days(){
  // Step 1: Get the list of users not seen in last 180 days
  let unseenUsers = listUnseenUsers();

  // Step 2: build email body
  let builtEmail = buildEmail(unseenUsers);

  // Step 3: send email
  sendEmail(builtEmail);
}

function listUnseenUsers() {
  let pageToken;
  let page;
  let dateLimit = new Date(Date.now() - (180 * 24 * 60 * 60 * 1000));
  let userList = [];
  do {
    page = AdminDirectory.Users.list({
      customer: 'my_customer',
      orderBy: 'givenName',
      maxResults: 100,
      pageToken: pageToken
    });
    const users = page.users;
    if (!users) {
      console.log('No users found.');
      return;
    }
    // Print the user's full name and email.
    for (const user of users) {
      if (new Date(user.lastLoginTime) < dateLimit){
        userList.push(user);
      }
    }
    pageToken = page.nextPageToken;
  } while (pageToken);
  
  userList.sort((a,b) => a.lastLoginTime - b.lastLoginTime);

  return userList;
}

function buildEmail(userList){
  
  let emailContent;

  if (userList.length <= 0){
    return `All accounts seen in the last 180 days`
  } else{
    emailContent = `<h1>Accounts not seen for more than 180 days  (${userList.length})</h1>`
    emailContent += `<table> <tr> 
      <th style='border-bottom: 1px solid black'>UPN</th>
      <th style='border-bottom: 1px solid black'>OrgUnitPath</th>
      <th style='border-bottom: 1px solid black'>Last Login Time</th>
      <th style='border-bottom: 1px solid black'>Days from today</th>
      <th style='border-bottom: 1px solid black'>Account State</th>
    </tr>`;

    for (let i=0; i<userList.length; i++){
      let rowToAppend = `<tr>
        <td style='border-bottom: 1px solid black'>${userList[i].primaryEmail}</td>
        <td style='border-bottom: 1px solid black'>${userList[i].orgUnitPath}</td>
        <td style='border-bottom: 1px solid black'>${getLastLoginDisplay(userList[i].lastLoginTime)}</td>
        <td style='border-bottom: 1px solid black'>${getLastSeenDate(userList[i].lastLoginTime)}</td>
        <td style='border-bottom: 1px solid black'>${isSuspended(userList[i].suspended)}</td>
      </tr>`;
      emailContent += rowToAppend;
    }
    emailContent += "</table>";
  }
  emailContent += `<p style='font-size:0.7em'>Generated at ${new Date(Date.now())} by GetUsersNotSeen180Days Script</p>`
  return emailContent;
}

function sendEmail(emailBody){
  MailApp.sendEmail({
    to: 'EMAIL_TO_SEND_TO',
    subject: '[AUD-GW] User Accounts not seen in the last 180 days',
    htmlBody: emailBody
    
  });
}

function isSuspended(userState){
  if (userState){
    return "Suspended"
  } else{
    return "Active"
  }
}

function getLastSeenDate(lastSeenString){
  const lastSeenDateType = new Date(lastSeenString);
  const today = new Date(Date.now());
  const diffTime = today.getTime() - lastSeenDateType.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays
}

function getLastLoginDisplay(lastLoginTime){
  if (lastLoginTime == '1970-01-01T00:00:00.000Z'){
    return "Never Logged In"
  } else{
    return lastLoginTime;
  }
}