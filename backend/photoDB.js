import * as fs from 'fs';
import mysql from 'mysql2/promise';
import dbCredentials from '../db-credentials.js';
import exifr from 'exifr';

const database = await mysql.createConnection(dbCredentials);

const files = fs.readdirSync('./frontend/photos/').filter(x => ['.jpg', '.jpeg'].some(ext => x.toLowerCase().endsWith(ext)));

for (let file of files) {
  let metadataphotos = await exifr.parse('./frontend/photos/' + file);

  let meta = metadataphotos ?? {};
  let json = JSON.stringify(meta);

  let [result] = await database.execute(`
    INSERT INTO photo (metaPhotos) VALUES (?)`, [file, metadataphotos]);
  console.log(file, json, result);
}
