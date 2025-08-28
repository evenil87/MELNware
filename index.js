// Get express so that we can create a web server
import express from 'express';
// Import the git-ignored db credentials
import dbCreds from './db-credentials.js';
// Get the database driver
import mysql from 'mysql2/promise';

// Import rest routes from backend folder
import setupPowerPointRestRoute from './backend/powerPointRestRoutes.js';

// Create the connection to database
const db = await mysql.createConnection(dbCreds);


// Create a web server called app
const app = express();

setupPowerPointRestRoute(app, db);

// Let Express serve all the content from frontend folder
app.use(express.static('frontend'));

// Start the web server at port 3000
app.listen(3000, () => console.log('Listening on http://localhost:3000'));