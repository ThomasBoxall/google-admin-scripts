/**
UpdateUserAttributes
TB, October 2025

Script to update the attributes of users in the Google Workspace tennant based on the input data provided in the input spreadsheet
**/

const DATA_SPREADSHEET_ID = 'SPREADSHEET_ID'

function updateUserAttributes(){
  // entry point for the application
  
  // we start by consuming the sheet
  const inputData = SpreadsheetApp.openById(DATA_SPREADSHEET_ID).getSheetByName('data').getDataRange().getValues();
  // remove the header row - so we are left with an array of arrays of data
  inputData.shift();

  for(const currentRecord of inputData){
    console.log(currentRecord[0]);
    processUser(currentRecord);
  }
  console.log("complete");
}

function processUser(userRecord){
  // we work through various attributes building payloads that can then be inserted into the push method to update the user

  // organisational attributes: job title, department, employee type (description)
  let organisationsPayload = [];
  organisationsPayload.push({
    primary: true,
    customType: "work",
    type: "work",
    title: userRecord[3] || undefined,
    department: userRecord[6] || undefined,
    description: userRecord[4] || undefined
  });

  // phones attributes: phones
  let phonesPayload = [];
  phonesPayload.push({
    primary: true,
    type: "work",
    value: userRecord[7]
  });

  // address attributes: formatted
  let addressesPayload = [];
  addressesPayload.push({
    primary: true,
    type: "work",
    formatted: userRecord[8] || undefined
  });

  // relations attributes: managerID
  let relationsPayload = [];
  relationsPayload.push({
    value: userRecord[5] || undefined,
    type: "manager"
  });
  
  // construct final resource to patch
  let resource = {};
  resource.organizations = organisationsPayload;
  resource.phones = phonesPayload;
  resource.addresses = addressesPayload;
  resource.relations = relationsPayload;

  // update the one user using their email to identify them
  let updatedUser = AdminDirectory.Users.update(resource, userRecord[0]);
  // output the updated user
  Logger.log(updatedUser);
}

function outputOneRecord(rowToOutput){
  // outputs the entire users data for debugging
  console.log(`Primary Email: ${rowToOutput[0]}`);
  console.log(`First Name: ${rowToOutput[1]}`);
  console.log(`Surname: ${rowToOutput[2]}`);
  console.log(`Job Title: ${rowToOutput[3]}`);
  console.log(`Type of Employee: ${rowToOutput[4]}`);
  console.log(`Manager's Email: ${rowToOutput[5]}`);
  console.log(`Department: ${rowToOutput[6]}`);
  console.log(`Phone: ${rowToOutput[7]}`);
  console.log(`Address: ${rowToOutput[8]}`);
}