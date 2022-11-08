//SHEET ID: 1ITgw1CF55HWEFxTzyRVMamXU7OvZlmu-_7hSgaidDfo


const express = require('express'); //Import the express dependency
const app = express();              //Instantiate an express app, the main work horse of this server
const port = 5000;                  //Save the port number where your server will be listening

//Idiomatic expression in express to route and respond to a client request
app.get('/', (req, res) => {        //get requests to the root ("/") will route here
    res.sendFile('index.html', {root: __dirname});      //server responds by sending the index.html file to the client's browser
                                                        //the .sendFile method needs the absolute path to the file, see: https://expressjs.com/en/4x/api.html#res.sendFile 
});

//medium post code
// const Sheets = require("node-sheets").default;
// const dotenv = require("dotenv");
// dotenv.config();
// (async () => {  try {
//   const gs = new Sheets("1ITgw1CF55HWEFxTzyRVMamXU7OvZlmu-_7hSgaidDfo");
//   await gs.authorizeApiKey(process.env.GOOGLE_SHEET_KEY);
//   /**
//   const table = await gs.tables("Class Data!A:F");
//   console.log(table.headers);
//   console.log(table.rows);
//   */ 
//   } catch (err) {    console.error(err);  }})();





//EVERYTHING BELOW THIS COMMENT IS GOOGLE SHEETS RELATED STUFF

const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
//^^ API doc's example

/**
 * Connected sheet to listCostumeOwners
 * 
 */
async function listCostumeOwners(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  const res = await sheets.spreadsheets.values.get({
    //old example spreadsheet
    //spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    spreadsheetId: '1ITgw1CF55HWEFxTzyRVMamXU7OvZlmu-_7hSgaidDfo',
    range: 'Costumes!A2:H',
  });
  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    console.log('No data found.');
    return;
  }
  console.log('Costume, Owner:');
  rows.forEach((row) => {
    // Print columns A and F, which correspond to indices 0 and 5.
    console.log(`${row[0]}, ${row[5]}`);

    console.log(`DUMPING DATA: 
    Costume name: ${row[0]} 
    Costume image: ${row[1]}
    Rented?: ${row[2]}
    Rentable?: ${row[3]}
    Location: ${row[4]}
    Who has it?: ${row[5]}
    Associated production: ${row[6]}
    Description: ${row[7]}`);
  });
}

authorize().then(listCostumeOwners).catch(console.error);

app.listen(port, () => {            //server starts listening for any attempts from a client to connect at port: {port}
    console.log(`Now listening on port ${port}`); 
});