const readline = require('readline');
const {google} = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];
const TOKEN_DIR = './credentials/';
const TOKEN_PATH = TOKEN_DIR + 'token.json';

exports.makeNewToken = (credentials, callback) => {
  console.log("makeNewToken")
  const clientId = credentials.client_id;
  const clientSecret = credentials.client_secret;
  const redirectUrl = credentials.redirect_uris[0];
  const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
  getNewToken(oauth2Client, callback);
}

exports.getVideoId = (credentials, token, channelId, liveStatus, callback) => {
  console.log("getVideoId")
  const oauth2Client = authorize(credentials, token, channelId, liveStatus);
  getCurrentStreaming(oauth2Client, channelId, liveStatus, callback)
}

function authorize(credentials, token) {
  const clientId = credentials.client_id;
  const clientSecret = credentials.client_secret;
  const redirectUrl = credentials.redirect_uris[0];
  const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
  return oauth2Client.credentials = JSON.parse(token);
}

function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) throw err;
    console.log('Token stored to ' + TOKEN_PATH);
  });
}

function getCurrentStreaming(auth, channelId, liveStatus, callback) {
    const service = google.youtube('v3');
    service.search.list({
        auth: auth,
        part: 'id,snippet',
        channelId: channelId,
        eventType: liveStatus,
        type: 'video',
        order: 'date',
        maxResults: '1'
    }, function(err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        const videos = response.data.items;
        if (videos.length == 0) {
            console.log('No video found.');
            return;
        }
        callback(videos[0].id.videoId);
    });
}