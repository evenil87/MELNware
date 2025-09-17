// Importeringar och konfiguration
// Denna fil importerar metadata från en JSON-fil till en MySQL-databas
import fs from 'fs';
import mysql from 'mysql2/promise';
import dbCreds from './db-credentials.js';

// Huvudfunktion för importering
async function main() {
  try {
    // Anslut till databasen 
    const db = await mysql.createConnection(dbCreds);

    // Läs och parsa JSON-filen
    const raw = fs.readFileSync('./frontend/powerPoint/powerPointJsonCleaned.json', 'utf-8');
    const data = JSON.parse(raw);

    // Rensa befintliga poster i tabellen
    await db.execute('DELETE FROM powerPoint');

    for (let metadata of data) {
      // Infoga metadata i databasen
      const [result] = await db.execute(`
        INSERT INTO powerPoint (metaPowerPoint)
        VALUES(?)
      `, [JSON.stringify(metadata)]);
      // Logga framgångsrik insättning
      console.log('Inserted:', metadata.fileName, 'ID:', result.insertId);
    }

    // Avsluta processen när importen är klar och stäng anslutningen till databasen
    console.log('Metadata import completed!');
    await db.end(); // stänger databasanslutningen
  } catch (err) {
    console.error('Error during import:', err);
    process.exit(1);
  }
}

main();
