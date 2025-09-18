// Hämta express för att kunna skapa en webbserver
import express from 'express';
// Importera databasuppgifter från en separat fil
import dbCreds from './db-credentials.js';
// Hämta databasmodulen för MySQL
import mysql from 'mysql2/promise';
// Importera alla rest-routes från backend-mappen
import setupPowerPointRestRoutes from './backend/powerPointRestRoutes.js';
import setupPowerPointRestRoutesAllMeta from './backend/powerPointRestRoutesAllMeta.js';
import setupPowerPointDownloadRoute from './backend/powerPointDownloadRoutes.js';
import setupPdfRestRoutes from './backend/pdfRestRoutes.js';
import setupMusicRestRoutes from './backend/musicRestRoutes.js';
import setupimageRestRoutes from './backend/imageRestRoutes.js';
// global search import
import setupGlobalSearchRoutes from './backend/globalSearchRoutes.js';

// Skapa en databasanslutning med hjälp av uppgifterna i db-credentials.js
const db = await mysql.createConnection(dbCreds);


// Skapa en webbserver med express kallad app 
const app = express();

// Lägg till rest-routes i app och skicka med databasanslutningen db 
setupPowerPointRestRoutes(app, db);
setupPowerPointRestRoutesAllMeta(app, db);
setupPowerPointDownloadRoute(app, db);
setupPdfRestRoutes(app, db);
setupMusicRestRoutes(app, db);
setupimageRestRoutes(app, db);
// global search
setupGlobalSearchRoutes(app, db);


// Låt express hantera statiska filer i frontend-mappen
app.use(express.static('frontend'));
//app.use('/music', express.static('frontend/music'));


// Starta servern på port 3000
app.listen(3000, () => console.log('Listening on http://localhost:3000'));
