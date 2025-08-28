import fs from 'fs';
import mysql from 'mysql2/promise';
import dbCreds from './db-credentials.js';

// Connect to a database.
const db = await mysql.createConnection(dbCreds);

// Load the JSON file.
const raw = fs.readFileSync('./frontend/powerPoint/powerPointJsonCleaned.json', 'utf-8');
const data = JSON.parse(raw);

// Clear the table first.
await db.execute('DELETE FROM powerPoint');

for (let metadata of data) {
  // Metadata is already a finished object from your cleaned file.

  // Save the entire object in the metaPowerPoint column as a JSON string.
  let [result] = await db.execute(`
    INSERT INTO powerPoint (metaPowerPoint)
    VALUES(?)
  `, [JSON.stringify(metadata)]);

  console.log('Inserted:', metadata.fileName, result.insertId);
}

// Exit process when import is done.
console.log('Metadata import completed!');
process.exit();
