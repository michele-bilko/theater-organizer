//SHEET ID: 1ITgw1CF55HWEFxTzyRVMamXU7OvZlmu-_7hSgaidDfo

//require('dotenv').config()
//require('dotenv').config({ path: require('find-config')('.env') })
const express = require('express'); 
const app = express();              
const port = 8000;
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
const session = require('express-session');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const { auth } = require('express-openid-connect');
const methodOverride = require('method-override');

app.use(methodOverride('_method'));

const config = {
  authRequired: false,
  auth0Logout: true,
  baseURL: 'http://localhost:8000',
  clientID: '06zCwX9qd2fmBJbnL8MKXlEgwBN0q3S0',
  issuerBaseURL: 'https://dev-2lr7o4xxm6vc88jn.us.auth0.com',
  secret: 'JhvFpbgpTE0Q7KG2COpQvjBqhT-HxJQTbg2gozKWIDE-Wx7opK7tms5yy0No3Wjy'
};

const allowedEmails = ['alemar23@bergen.org', 'britoo23@bergen.org', 'micbil23@bergen.org', 'vicper@bergen.org', 'stekap@bergen.org'];


function checkAdmin(req, res, next) {
  const userEmail = req.oidc.user.email; 
  if (allowedEmails.includes(userEmail)) {
    next();
  } else {
    res.send('Access denied');
  }
}

app.use(auth(config));

app.use((req, res, next) => {
  res.locals.user = req.oidc.user || null;
  next();
});

// req.isAuthenticated is provided from the auth router
//app.get('/', (req, res) => {
  ////res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out')
//});

const { requiresAuth } = require('express-openid-connect');

app.get('/profile', requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user));
  user: req.oidc.user
});

app.get('/extra', requiresAuth(), checkAdmin);


app.set('view engine', 'ejs');

// index page
app.get('/', function(req, res) {
  //app.get('/theater-organizer/views/partials/header', function(req, res) {
  //});
  var tagline1 = "Inventory of all costumes in the closet";
  var tagline2 = "Inventory of all props in the closet";
  //user: req.user; // define the user variable as a local variable

  res.render('pages/index', {
    tagline1: tagline1,
    tagline2: tagline2,
    user: req.oidc.user
  });

  
  
});


const credentials = require('/Users/alessandromartinez/Documents/GitHub/theater-organizer/credentials.json');
const sheetId = '1ITgw1CF55HWEFxTzyRVMamXU7OvZlmu-_7hSgaidDfo';


app.delete('/costumes/:id', async (req, res) => {
  const costumeId = req.params.id;
  
  try {
    // Authenticate with Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  
    // Create Google Sheets API client
    const sheets = google.sheets({ version: 'v4', auth });
  
    // Get all rows from the sheet
    const getRowsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Costumes', // Replace with the actual sheet name or range
    });
    const rows = getRowsResponse.data.values;
  
    // Find the row index with the matching costume ID
    const rowIndex = rows.findIndex(row => row[0] === costumeId);
  
    if (rowIndex !== -1) {
      // Set the entire row to blank
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `Costumes!A${rowIndex + 1}:AE${rowIndex + 1}`, // Replace with the actual sheet name or range
        valueInputOption: 'RAW',
        resource: { values: [[]] },
      });
  
      // Successful deletion
      res.sendStatus(200);
    } else {
      // Costume not found
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('Error:', error);
    // Show error message
    res.sendStatus(500);
  }
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
    tagline: tagline,
    user: req.oidc.user
  });
});         

//costume and prop pages
app.get('/costumes', async function(req, res){
  var auth = await authorize();
  
  //call loadCostumeData
  var costume = await getCostumeInfo(auth);
  var rows = await loadCostumeData(auth);
  console.log(rows);
  res.render('pages/costumes', {
    user: req.oidc.user,
    rows: rows,
    costume: costume
  });
});

app.get('/costumes/:id', async function(req, res) {
  const auth = await authorize();
  const id = req.params.id;
  const costume = await getCostumeById(id, auth);
  res.render('pages/costume_detail', { costume: costume, user: req.oidc.user });
});

async function getCostumeById(id, auth) {
  const rows = await getCostumeInfo(auth);
  const costume = rows.find(row => row.id === id);
  return costume;
}

app.post('/costumes/:id', async function(req, res) {
  const id = req.params.id;
  const auth = await authorize();
  const sheets = google.sheets({ version: 'v4', auth });

  const index = await getCostumeIndexById(id);

  if (index !== -1) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: '1ITgw1CF55HWEFxTzyRVMamXU7OvZlmu-_7hSgaidDfo',
      resource: {
        data: [
          {
            range: `Costumes!A${index}:AE${index}`,
            values: [['']],
            majorDimension: 'ROWS'
          }
        ],
        valueInputOption: 'USER_ENTERED'
      }
    });
  }

  res.redirect('/costumes');
});

async function getCostumeIndexById(id) {
  const auth = await authorize();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: '1ITgw1CF55HWEFxTzyRVMamXU7OvZlmu-_7hSgaidDfo',
    range: 'Costumes!A1:AE9999'
  });

  const rows = response.data.values || [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row[8] === id) {
      return i + 1;
    }
  }

  return -1; 
}

//loading item cards for costumes
// app.get('/costumes/:id', async function(req, res){
//   var id = req.params.id ;
//   var costume_row = await loadCostumeDataOneRow(auth id);

//   res.render('pages/costume_detail', {
//     costume_row: costume_row
//   });
// });


app.get('/props', async function(req, res){
  //req.params.id
  var auth = await authorize();
  
  //call loadCostumeData
  var rows = await loadPropData(auth);
  console.log(rows);
  res.render('pages/props', {
    user: req.oidc.user,
    rows: rows
  });
});

app.get('/extra', function(req, res){
  res.render('pages/extra', {
    user: req.oidc.user
  });
});

app.get('/formsubmit', function(req, res){
  res.render('pages/formsubmit', { user: req.oidc.user });
});

app.get('/rent', function(req, res){
  res.render('pages/rent', {user: req.oidc.user});
});

app.get('/costume-expand', function(req, res){
  res.render('pages/costume-expand', {user: req.oidc.user});
});


//EVERYTHING BELOW THIS COMMENT IS GOOGLE SHEETS RELATED STUFF

const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
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


async function getCostumeInfo(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1ITgw1CF55HWEFxTzyRVMamXU7OvZlmu-_7hSgaidDfo',
    range: 'Costumes!A2:AE',
  });
  const rows = res.data.values;

  const costumes = rows.map((row) => {
    return {
    id: row[8], costumeName: row[1], 
    isRented: row[2], isRentable: row[3], 
    costumeImage: row[4], costumeDescription: row[5], costumeTags: row[6], costumeSize: row[7], costumeColor: row[10], costumeLocation: row[11], costumePattern: row[16], costumeType: row[17], costumeHem: row[18], costumeChest: row[19], costumeNeck: row[20], costumeWaist: row[21], costumeSleeve: row[22], costumeInSeam: row[23], costumeFabric: row[26]
    };
  });

  return costumes
}

//loading costumes and props
async function loadCostumeData(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1ITgw1CF55HWEFxTzyRVMamXU7OvZlmu-_7hSgaidDfo',
    range: 'Costumes!A2:AE',
  });
  const rows = res.data.values;

  const costumes = rows.map((row) => {
    return {
    costumeName: `${row[1]}`, 
    isRented: `${row[2]}`, isRentable: `${row[3]}`, 
    costumeImage: `${row[4]}`, costumeDescription: `${row[5]}`, costumeTags: `${row[6]}`, costumeSize: `${row[7]}`, costumeId: `${row[8]}`, costumeColor: `${row[10]}`, costumeLocation: `${row[11]}`, costumePattern: `${row[16]}`, costumeType: `${row[17]}`, costumeHem: `${row[18]}`, costumeChest: `${row[19]}`, costumeNeck: `${row[20]}`, costumeWaist: `${row[21]}`, costumeSleeve: `${row[22]}`, costumeInSeam: `${row[23]}`, costumeFabric: `${row[26]}`  // column A
      // add more properties as needed
    };
  });

  if (!rows || rows.length === 0) {
    console.log('No data found.');
    return;
  }
  //return formatted rows;


/**
 * FOR ADDING PAGES/SPECIFYING ROWS OF COSTUMES
 * 
 */

  var costumeRows = [];
  var itemCount = 0;
  rows.forEach((row) => {
    itemCount++,
    costumeRows.push({costumeNumber: itemCount, costumeName: `${row[1]}`, 
    isRented: `${row[2]}`, isRentable: `${row[3]}`, 
    costumeImage: `${row[4]}`, costumeDescription: `${row[5]}`, costumeTags: `${row[6]}`, costumeSize: `${row[7]}`, costumeId: `${row[8]}`, costumeColor: `${row[10]}`, costumeLocation: `${row[11]}`, costumePattern: `${row[16]}`, costumeType: `${row[17]}`, costumeHem: `${row[18]}`, costumeChest: `${row[19]}`, costumeNeck: `${row[20]}`, costumeWaist: `${row[21]}`, costumeSleeve: `${row[22]}`, costumeInSeam: `${row[23]}`, costumeFabric: `${row[26]}`});
  });
  return costumeRows;
}

async function loadPropData(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1ITgw1CF55HWEFxTzyRVMamXU7OvZlmu-_7hSgaidDfo',
    range: 'Props!A2:AE',
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
