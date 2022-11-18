//SHEET ID: 1ITgw1CF55HWEFxTzyRVMamXU7OvZlmu-_7hSgaidDfo
//https://www.npmjs.com/package/google-spreadsheet
//https://developers.google.com/sheets/api/quickstart/nodejs
//medium post?
//https://medium.com/geekculture/read-google-sheets-rows-in-node-js-6bb13956ee32
//https://www.section.io/engineering-education/google-sheets-api-in-nodejs/ 
//????!?!?!? maybe????
//no!!!! that does not work!!

const express = require('express'); 
const app = express();              
const port = 5000;

// set the view engine to ejs
app.set('view engine', 'ejs');

// use res.render to load up an ejs view file

// index page
app.get('/', function(req, res) {
  var mascots = [
    { name: 'Sammy', organization: "DigitalOcean", birth_year: 2012},
    { name: 'Tux', organization: "Linux", birth_year: 1996},
    { name: 'Moby Dock', organization: "Docker", birth_year: 2013}
  ];
  var tagline = "Look! This tagline works!";

  res.render('pages/index', {
    mascots: mascots,
    tagline: tagline
  });
});

// about page
app.get('/about', function(req, res) {
  res.render('pages/about');
});               

// app.get('/', (req, res) => {        //get requests to the root ("/") will route here
//     res.sendFile('index.html', {root: __dirname});      //server responds by sending the index.html file to the client's browser
//                                                         //the .sendFile method needs the absolute path to the file, see: https://expressjs.com/en/4x/api.html#res.sendFile 
// });


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
 * Connected sheet to listCostumeOwners
 * 
 */
async function listCostumeOwners(auth) {
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
//if token is "expired" delete token.json and run code again

app.listen(port, () => { //port 5000 for the moment
    console.log(`Now listening on port ${port}`); 
});









// //NEW ATTEMPT
// // inlcude express 
// const express = require("express");
// //googleapis
// const { google } = require("googleapis");
// //initilize express
// const app = express();
// //set app view engine
// app.set("view engine", "ejs");

// app.post("/", async (req, res) => {
//     const { request, name } = req.body;
// })

// const auth = new google.auth.GoogleAuth({
//     keyFile: "keys.json", //the key file
//     //url to spreadsheets API
//     scopes: "https://www.googleapis.com/auth/spreadsheets", 
// });

// //Auth client Object
// const authClientObject = await auth.getClient();
// //Google sheets instance
// const googleSheetsInstance = google.sheets({ version: "v4", auth: authClientObject });
// // spreadsheet id
// const spreadsheetId = "1ITgw1CF55HWEFxTzyRVMamXU7OvZlmu-_7hSgaidDfo";
// await googleSheetsInstance.spreadsheets.values.append({
//     auth, //auth object
//     spreadsheetId, //spreadsheet id
//     range: "Sheet1!A:B", //sheet name and range of cells
//     valueInputOption: "USER_ENTERED", // The information will be passed according to what the usere passes in as date, number or text
//     resource: {
//         values: [["Git followers tutorial", "Mia Roberts"]],
//     },
// });

//  //Read from the spreadsheet
//  const readData = await googleSheetsInstance.spreadsheets.values.get({
//     auth, //auth object
//     spreadsheetId, // spreadsheet id
//     range: "Sheet1!A:A", //range of cells to read from.
// })

// //send the data read with the response
// response.send(readData.data)


// const port = 5000;
// app.listen(port, ()=>{
//     console.log(`server started on ${port}`)
// });





// //new NEW attempt

// const express = require('express');
// const {google} = require('googleapis');
// const keys = require('./keys.json');

// //initialize express
// const app = express();
// app.use(express.urlencoded({ extended: true }));

// //set up template engine to render html files
// app.set('view engine', 'ejs');
// app.engine('html', require('ejs').renderFile);

// // index route
// app.get('/', (request, response) =>{
//     response.render('index')
// });

// app.post('/',  async (request, response) =>{
//     const {article, author} = request.body;
//     const auth = new google.auth.GoogleAuth({
//         keyFile: "keys.json", //the key file
//         //url to spreadsheets API
//         scopes: "https://www.googleapis.com/auth/spreadsheets", 
//     });

//     //Auth client Object
//     const authClientObject = await auth.getClient();
    
//     //Google sheets instance
//     const googleSheetsInstance = google.sheets({ version: "v4", auth: authClientObject });

//     // spreadsheet id
//     const spreadsheetId = "1ITgw1CF55HWEFxTzyRVMamXU7OvZlmu-_7hSgaidDfo";

//     // Get metadata about spreadsheet
//     const sheetInfo = await googleSheetsInstance.spreadsheets.get({
//         auth,
//         spreadsheetId,
//     });

//     //Read from the spreadsheet
//     const readData = await googleSheetsInstance.spreadsheets.values.get({
//         auth, //auth object
//         spreadsheetId, // spreadsheet id
//         range: "Sheet1!A:A", //range of cells to read from.
//     });
    

//     //write data into the google sheets
//     await googleSheetsInstance.spreadsheets.values.append({
//         auth, //auth object
//         spreadsheetId, //spreadsheet id
//         range: "Sheet1!A:B", //sheet name and range of cells
//         valueInputOption: "USER_ENTERED", // The information will be passed according to what the usere passes in as date, number or text
//         resource: {
//             values: [[article, author]]
//         },
//     });
    
//     response.send("Request submitted.!!")
// });


// const PORT = 5000;

// //start server
// const server = app.listen(PORT, () =>{
//     console.log(`Server started on port localhost:${PORT}`);
// });