import fs from 'fs';
import mysql from 'mysql2/promise';
import dbCreds from './db-credentials.js';

async function main() {
  try {
    // Connect to the database
    const db = await mysql.createConnection(dbCreds);

    // Load the JSON file
    const raw = fs.readFileSync('./frontend/powerPoint/powerPointJsonCleaned.json', 'utf-8');
    const data = JSON.parse(raw);

    // Clear the table first
    await db.execute('DELETE FROM powerPoint');

    for (let metadata of data) {
      // Insert metadata as JSON string
      const [result] = await db.execute(`
        INSERT INTO powerPoint (metaPowerPoint)
        VALUES(?)
      `, [JSON.stringify(metadata)]);

      console.log('Inserted:', metadata.fileName, 'ID:', result.insertId);
    }

    console.log('Metadata import completed!');
    await db.end(); // stänger databasanslutningen
  } catch (err) {
    console.error('Error during import:', err);
    process.exit(1);
  }
}

main();
