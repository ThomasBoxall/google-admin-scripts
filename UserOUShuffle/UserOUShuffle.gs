function userOuShuffle(){
  let usersToMove = fetchUsersToMoveFromSpreadsheet();
  let newOrganisationalUnit = 'NEW/ORG/UNIT/PATH';
  for (const currentUser of usersToMove){
    moveSingleUser(currentUser, newOrganisationalUnit);
  }
}

function moveSingleUser(userToMoveEmail, newOrgUnit){
  let user = AdminDirectory.Users.get(userToMoveEmail);
  user.orgUnitPath = newOrgUnit;
  AdminDirectory.Users.update(user, userToMoveEmail);
  console.log(`[INFO] Moved ${userToMoveEmail} to ${newOrgUnit}`);
}

function fetchUsersToMoveFromSpreadsheet(){
  const result = SpreadsheetApp.openById('YOUR_SS_ID').getDataRange().getValues();
  let fetchedUsers = [];
  // now make the array of arrays into an array
  for (let i = 0; i < result.length; i++){
    for (let j = 0; j < result[i].length; j++){
      fetchedUsers.push(result[i][j]);
    }
  }
  return fetchedUsers;
}