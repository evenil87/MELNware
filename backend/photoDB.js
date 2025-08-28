import fs from 'fs';
import mysql from 'mysql2/promise';
import dbCredentials from './db-credentials.js';
import * as exifr from 'exifr';

const database = await mysql.createConnection(dbCredentials);

const files = fs.readdirSync('./frontend/photos/').filter(x => ['.jpg', '.jpeg'].some(ext => x.toLowerCase().endsWith(ext)));

for (let file of files) {
  let metadataphotos = await exifr.parse('./frontend/photos/' + file);
  let cleaned = { file, metadataphotos };

  let [result] = await database.execute(`
    INSERT INTO photo (filename, metadata) VALUES (?, ?)`, [cleaned.file, JSON.stringify(cleaned.metadataphotos)]);
  console.log(file, result);
}
