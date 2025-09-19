import fs from 'fs';
import mysql from 'mysql2/promise';
import pdfParse from 'pdf-parse-fork';
import dbCredentials from '../db-credentials.js';

// Koppla upp mot databasen
const db = await mysql.createConnection(dbCredentials);

// Läs alla PDF-filer i mappen
const files = fs.readdirSync('./frontend/pdfs').filter(f => f.toLowerCase().endsWith('.pdf'));

// Rensa tabellen
await db.execute('DELETE FROM pdf');

for (let file of files) {
  // Läs metadata från PDF
  let pdfMetadata = fs.readFileSync('./frontend/pdfs/' + file);
  let data = await pdfParse(pdfMetadata);

  let meta = { file, ...data };

  // Importera till databasen som JSON
  let [result] = await db.execute(`
    INSERT INTO pdf (metaPdf)
    VALUES(CAST(? AS JSON))
  `, [JSON.stringify(meta)]);

  console.log('Metadata saved for', file);
}

console.log('Imported all PDF metadata!');
process.exit();