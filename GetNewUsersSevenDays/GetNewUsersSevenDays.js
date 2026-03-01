/**
GetNewUsersSevenDays - Audit script to email people with a list of newly created users within the last 7 days. Used to audit what accounts are created. 

SCHEDULED TRIGGER to run time-based, weekly, Midnight to 1am on a Monday

**/

function GetNewUsersSevenDays(){
  // Step 1: Get the list of new users from the last 7 days
  let newUsers = listNewUsers();

  // Step 2: build email body
  let emailBody = buildEmail(newUsers)
  console.log(emailBody);

  // Step 3: Prepare email and send
  sendEmail(emailBody);
}

function listNewUsers() {
  let pageToken;
  let page;
  let dateLimit = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
  let userList = [];
  do {
    page = AdminDirectory.Users.list({
      customer: 'my_customer',
      orderBy: 'givenName',
      maxResults: 100,
      pageToken: pageToken,
      projection: 'full'
    });
    const users = page.users;
    if (!users) {
      console.log('No users found.');
      return;
    }
    // Print the user's full name and email.
    for (const user of users) {
      if (new Date(user.creationTime) > dateLimit){
        console.log('%s (%s), %s', user.name.fullName, user.primaryEmail, user.creationTime, user);
        userList.push(user);
      }
    }
    pageToken = page.nextPageToken;
  } while (pageToken);
  return userList;
}

function buildEmail(userList){
  let emailContent;
  if (userList.length <= 0){
    return "No accounts created in the last 7 days"
  } else{
    emailContent = "<h1>Accounts created in the last 7 days</h1>"
    for (let user of userList){
      let jobTitle = "⚠️ Not Set ⚠️";
      let department = "⚠️ Not Set ⚠️";
      let description = "⚠️ Not Set ⚠️";
      if (user.organizations && user.organizations.length > 0) {
        let primaryOrg = user.organizations.find(org => org.primary) || user.organizations[0];
        jobTitle = primaryOrg.title || "No Title";
        department = primaryOrg.department || "No Department";
        description = primaryOrg.description || "No Description";
      }
      let managerEmail = "⚠️ Not Set ⚠️";
      if (user.relations && user.relations.length > 0) {
        let managerRel = user.relations.find(rel => rel.type === "manager");
        managerEmail = managerRel ? managerRel.value : "No Manager";
      }
      // emailContent += `<p><b>${user.name.fullName}</b><br> Primary Email: ${user.primaryEmail}<br> OrgUnit: ${user.orgUnitPath}<br> Created At: ${user.creationTime}</p>`;
      emailContent += `
        <div style="border-bottom: 1px solid #ccc; padding: 10px 0;">
          <p><b>${user.name.fullName}</b> (${user.primaryEmail})</p>
          <ul>
            <li><b>OrgUnit:</b> ${user.orgUnitPath}</li>
            <li><b>Job Title:</b> ${jobTitle}</li>
            <li><b>Department:</b> ${department}</li>
            <li><b>User Type (description):</b> ${description}</li>
            <li><b>Manager:</b> ${managerEmail}</li>
            <li><b>Created At:</b> ${user.creationTime}</li>
          </ul>
        </div>`;
    }
  }
  emailContent += `<p style='font-size:0.7em'>Generated at ${new Date(Date.now())} by GetNewUsersSevenDays Script</p>`
  return emailContent;
}

function sendEmail(emailBody){
  MailApp.sendEmail({
    to: 'email@email.com',
    subject: '[AUD-GW] New User Accounts Created In The Last 7 Days',
    htmlBody: emailBody
    
  });
}
