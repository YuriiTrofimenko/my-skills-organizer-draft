const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const integrationAPI = require('./intergration-api');
const apiv1 = require('./api-v1');

exports.addNode = integrationAPI.addNode(functions, admin);
exports.aims = apiv1.aims(functions, admin);
