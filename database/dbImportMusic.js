import fs from 'fs';
import * as musicMetadata from 'music-metadata';
import mysql from 'mysql2/promise';
import dbCredentials from '../db-credentials.js';

// Anslut till databasen
const db = await mysql.createConnection(dbCredentials);

// Läs in alla filer i mappen frontend/music
const files = fs.readdirSync('./frontend/music');

// Ta bort all tidigare metadata (om du vill behålla tidigare metadata, kommentera bort raden nedanför)
//await db.execute('DELETE FROM musicMeta');

for (let file of files) {
  // Hämta metadata med hjälp av music-metadata
  let metadata = await musicMetadata.parseFile('./frontend/music/' + file);
  // Skapa ett "rengjort" objekt med endast de fält vi vill spara
  // Vi vill importera filnamn, common och format
  let cleaned = { file, common: metadata.common, format: metadata.format };

  // Spara metadata i databasen som JSON 
  let [result] = await db.execute(`
    INSERT INTO music (metaMusic)
    VALUES(CAST(? as JSON))
  `, [cleaned]);

  console.log(file, result);
}

// Avsluta processen när allt är klart
console.log('All music metadata imported!');
process.exit();