const SPREADSHEET_ID = 'INSERT HERE';


function getGroupsStateOfNation() {
  // Script to get the state of membership of all groups in the Tennant and dump into a spreadsheet for subsequent playing with

  // our spreadsheet
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('output');

  // first we get all the groups in the domain into a sensible format
  const allGroups = listAllGroups();

  // now we have our groups, we can iterate through them, get their members & banish it to the spreadsheet

  // but first - prepare the spreadsheet for action
  initSpreadsheet(ss);

  for (currentGroup of allGroups){
    let groupRoles = getGroupRoles(currentGroup)  ;
    writeGroupToSpreadsheet(ss, currentGroup, groupRoles[0], groupRoles[1], groupRoles[2]);
  }
  
}

function listAllGroups() {
  // returns all groups in the domains in a single array. uses AdminDirectory API to obtain information.
  let allGroups = [];
  let pageToken;
  let page;
  do {
    page = AdminDirectory.Groups.list({
      customer: 'my_customer',
      maxResults: 100,
      pageToken: pageToken
    });
    const groups = page.groups;
    if (!groups) {
      console.log('No groups found.');
      return;
    }
    // Print group name and email.
    for (const group of groups) {
      allGroups.push(group)
    }
    pageToken = page.nextPageToken;
  } while (pageToken);
  return allGroups;
}

function initSpreadsheet(ss){
  // initialises spreadsheet for action
  ss.clear();
  ss.appendRow(['Name', 'Email', 'Description', 'Admin Created', 'Owners', 'Managers', 'Members']);
}

function getGroupRoles(groupToExplore){
  // fetches and sorts members of a single group into three arrays. Returns array of arrays

  // but first - check if directMembers > 0
  if (groupToExplore.directMembersCount !="0"){
    let allMembers = AdminDirectory.Members.list(groupToExplore.email).members;

    let members = []
    let owners = []
    let managers = []

    for (const curr of allMembers){
      switch (curr.role){
        case "MEMBER":
          members.push(curr);
          break;
        case "OWNER":
          owners.push(curr);
          break;
        case "MANAGER":
          managers.push(curr);
          break;
      }
    }

    return [owners, managers, members]
  }
  else{
    // there are no members in the group so we return empty arrays to signify this.
    return [[],[],[]]
  }
}

function writeGroupToSpreadsheet(ss, group, owners, managers, members){
  // writes a single group to the spreadsheet
  const groupName = group.name;
  const groupEmail = group.email;
  const groupDescription = group.description;
  const groupAdminCreated = group.adminCreated;
  const groupOwners = formatGroupMemberList(owners);
  const groupManagers = formatGroupMemberList(managers);
  const groupMembers = formatGroupMemberList(members);

  ss.appendRow([groupName, groupEmail, groupDescription, groupAdminCreated, groupOwners, groupManagers, groupMembers]);
}

function formatGroupMemberList(input){
  // formats an array of members into the correct format for spreadsheetification
  let output = '';

  let len = input.length;
  const finalItemNumb = len-1;

  // add all bar the last with \n
  for (let count = 0; count < len-1; count++){
    output+=(input[count].email + '\n');
  }
  // now add the last one without \n on the end
  if (finalItemNumb >= 0){
    output+=(input[finalItemNumb].email + '');
  }

  return output;
}