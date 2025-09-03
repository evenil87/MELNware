import fs from 'fs';
import mysql from 'mysql2/promise';
import pdfParse from 'pdf-parse-fork';
import dbCredentials from '../db-credentials.js'; 

// koppla upp mot databasen
const db = await mysql.createConnection(dbCredentials);

// läs alla PDF-filer i mappen
const files = fs.readdirSync('./frontend/pdfs').filter(f => f.toLowerCase().endsWith('.pdf'));

for (let file of files) {
  // läs metadata från PDF
  const pdfMetadata = fs.readFileSync('./frontend/pdfs/' + file);
  const data = await pdfParse(pdfMetadata);

  const meta = { file, ...data };

  // spara som JSON
  const json = JSON.stringify(meta);
  await db.execute(
    'INSERT INTO pdf (metaPdf) VALUES (CAST(? AS JSON))',
    [json]
  );

  console.log('Metadata saved for', file);
}

console.log('Imported all PDF metadata!');
process.exit(0);