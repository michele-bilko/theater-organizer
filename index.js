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
const { GoogleSpreadsheet } = require('google-spreadsheet');

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
    user: req.oidc.user,
    allowedEmails: allowedEmails
  });

  
  
});


const credentials = 'credentials.json';
const sheetId = '1ITgw1CF55HWEFxTzyRVMamXU7OvZlmu-_7hSgaidDfo';


app.delete('/costumes/:costumeid', requiresAuth(), checkAdmin, async (req, res) => {
  const costumeId = req.params.costumeid;
  console.log(costumeId);


  try {
    // Authenticate with Google Sheets API
    const auth = await authorize();

    // Create Google Sheets API client
    const sheets = google.sheets({ version: 'v4', auth });

    // Get all rows from the sheet
    const getRowsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: '1ITgw1CF55HWEFxTzyRVMamXU7OvZlmu-_7hSgaidDfo',
      range: 'Costumes',
    });
    const rows = getRowsResponse.data.values;

    // Find the row index with the matching costume ID
    const rowIndex = rows.findIndex(row => row[8] === costumeId);

    if (rowIndex !== -1) {
      // Calculate the A1 notation range for the specific row
      const range = `Costumes!A${rowIndex + 1}:AE${rowIndex + 1}`;

      // Clear the values in the specific row
      await sheets.spreadsheets.values.clear({
        spreadsheetId: '1ITgw1CF55HWEFxTzyRVMamXU7OvZlmu-_7hSgaidDfo',
        range,
      });

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: '1ITgw1CF55HWEFxTzyRVMamXU7OvZlmu-_7hSgaidDfo',
        resource: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: 0,
                  dimension: 'ROWS',
                  startIndex: rowIndex,
                  endIndex: rowIndex + 1,
                },
              },
            },
          ],
        },
      });

      // Successful deletion
      res.redirect('/costumes');

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
    costume: costume,
    allowedEmails: allowedEmails
  });
});

app.get('/costumes/:id', async function(req, res) {
  const auth = await authorize();
  const id = req.params.id;
  const costume = await getCostumeById(id, auth);
  res.render('pages/costume_detail', { costume: costume, user: req.oidc.user, allowedEmails: allowedEmails });
});

async function getCostumeById(id, auth) {
  const rows = await getCostumeInfo(auth);
  const costume = rows.find(row => row.id === id);
  return costume;
}







async function updateCostumeDetails(costumeId, updatedData) {
  try {
    // Load the credentials from a JSON file (client_secret.json) or specify them directly
    const auth = new google.auth.GoogleAuth({
      // Scopes needed for the Google Sheets API
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const authClient = await auth.getClient();

    // ID of your Google Sheet
    const spreadsheetId = '1ITgw1CF55HWEFxTzyRVMamXU7OvZlmu-_7hSgaidDfo';
    // Range in the sheet where the costume details are stored
    const range = 'Costumes!A2:AE';

    // Get the current data from the sheet
    const response = await sheets.spreadsheets.values.get({
      auth: authClient,
      spreadsheetId,
      range,
    });
    const rows = response.data.values || [];

    // Find the row with the matching costume ID
    const rowIndex = rows.findIndex(row => row[8] === costumeId);

    if (rowIndex !== -1) {
      // Update the row with the new data
      rows[rowIndex] = updatedData;

      // Prepare the request to update the sheet
      const updateRequest = {
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: rows,
        },
      };

      // Update the sheet with the updated data
      await sheets.spreadsheets.values.update(updateRequest);
      console.log('Costume details updated successfully!');
    } else {
      console.log('Costume ID not found!');
    }
  } catch (error) {
    console.error('Error updating costume details:', error);
  }
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
    user: req.oidc.user,
    allowedEmails: allowedEmails
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
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1ITgw1CF55HWEFxTzyRVMamXU7OvZlmu-_7hSgaidDfo',
    range: 'Costumes!A2:AE',
  });
  const rows = res.data.values;

  if (!rows || rows.length === 0) {
    console.log('No data found.');
    return [];
  }

  const costumes = rows
    .filter(row => row.some(cell => cell !== '')) // Filter out rows with all empty cells
    .map(row => {
      return {
        costumeName: `${row[1]}`,
        isRented: `${row[2]}`,
        isRentable: `${row[3]}`,
        costumeImage: `${row[4]}`,
        costumeDescription: `${row[5]}`,
        costumeTags: `${row[6]}`,
        costumeSize: `${row[7]}`,
        costumeId: `${row[8]}`,
        costumeColor: `${row[10]}`,
        costumeLocation: `${row[11]}`,
        costumePattern: `${row[16]}`,
        costumeType: `${row[17]}`,
        costumeHem: `${row[18]}`,
        costumeChest: `${row[19]}`,
        costumeNeck: `${row[20]}`,
        costumeWaist: `${row[21]}`,
        costumeSleeve: `${row[22]}`,
        costumeInSeam: `${row[23]}`,
        costumeFabric: `${row[26]}`,
      };
    });

  return costumes;
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
