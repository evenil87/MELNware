import fs from 'fs';
import mysql from 'mysql2/promise';
import dbCreds from './db-credentials.js';

// connect to db
const db = await mysql.createConnection(dbCreds);

// read all files
const files = fs.readdirSync('./pp-json');

// remove all posts from the musicMeta
await db.execute('DELETE FROM musicMeta');

for (let file of files) {
  // get all metadata
  let metadata = await musicMetadata.parseFile('./frontend/music/' + file);
  // create cleaned up version with filename + metadata
  // we want to import mysql
  let cleaned = { file, common: metadata.common, format: metadata.format };

  let [result] = await db.execute(`
    INSERT INTO musicMeta (meta)
    VALUES(?)
  `, [cleaned]);
  console.log(file, result);
}

// Exit process when import is done
console.log('All metadata imported!');
process.exit();