//SHEET ID: 1ITgw1CF55HWEFxTzyRVMamXU7OvZlmu-_7hSgaidDfo

//require('dotenv').config()
//require('dotenv').config({ path: require('find-config')('.env') })
const express = require('express'); 
const app = express();              
const port = 8000;

app.set('view engine', 'ejs');

// index page
app.get('/', function(req, res) {
  var tagline1 = "Inventory of all costumes in the closet";
  var tagline2 = "Inventory of all props in the closet";

  res.render('pages/index', {
    tagline1: tagline1,
    tagline2: tagline2
  });
  
});

// about page
app.get('/about', function(req, res) {
  var creators = [
    { name: 'Michele', academy: "ATCS", grad_year: 2023, contact: 'micbil23@bergen.org'},
    { name: 'Brian', academy: "ATCS", grad_year: 2023, contact: 'britoo23@bergen.org'},
    { name: 'Alessandro', academy: "ATCS", grad_year: 2023, contact: 'alemar23@bergen.org'}
  ];
  var tagline = "Look! This tagline works!";

  res.render('pages/about', {
    creators: creators,
    tagline: tagline
  });
});         

//costume and prop pages
app.get('/costumes', async function(req, res){

  var auth = await authorize();
  
  //call loadCostumeData
  var rows = await loadCostumeData(auth);
  console.log(rows);
  res.render('pages/costumes', {
    rows: rows
  });
});

//loading item cards for costumes
// app.get('/costumes/:id', async function(req, res){
//   var id = req.params.id ;

//   res.render('costumes', {
//     //
//   });
// });


app.get('/props', async function(req, res){
  //req.params.id
  var auth = await authorize();
  
  //call loadCostumeData
  var rows = await loadPropData(auth);
  console.log(rows);
  res.render('pages/props', {
    rows: rows
  });
});

app.get('/extra', function(req, res){
  res.render('pages/extra');
});

app.get('/formsubmit', function(req, res){
  res.render('pages/formsubmit');
});

app.get('/rent', function(req, res){
  res.render('pages/rent');
});


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

//loading costumes and props
async function loadCostumeData(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1ITgw1CF55HWEFxTzyRVMamXU7OvZlmu-_7hSgaidDfo',
    range: 'Costumes!A2:H',
  });
  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    console.log('No data found.');
    return;
  }
  //return formatted rows;
  var costumeRows = [];
  rows.forEach((row) => {
    costumeRows.push({costumeName: `${row[1]}`, 
    isRented: `${row[2]}`, isRentable: `${row[3]}`, 
    costumeImage: `${row[4]}`, costumeDescription: `${row[5]}`, costumeTags: `${row[6]}`});
  });
  return costumeRows;
}

async function loadPropData(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1ITgw1CF55HWEFxTzyRVMamXU7OvZlmu-_7hSgaidDfo',
    range: 'Props!A2:H',
  });
  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    console.log('No data found.');
    return;
  }
  //return formatted rows;
  var propRows = [];
  rows.forEach((row) => {
    propRows.push({propName: `${row[1]}`, 
    isRented: `${row[2]}`, isRentable: `${row[3]}`, 
    propImage: `${row[4]}`, propDescription: `${row[5]}`, propTags: `${row[6]}`});
  });
  return propRows;
}

// authorize().then(listCostumeOwners).catch(console.error);
//if token is "expired" delete token.json and run code again

app.listen(port, () => { //port 5000 for the moment
    console.log(`Now listening on port ${port}`); 
});
