import * as fs from 'fs';
import mysql from 'mysql2/promise';
import dbCredentials from '../db-credentials.js';
import exifr from 'exifr';

// Koden nedanför körs för att skapa en anlutning till databasen
// await kommandot är asynkront, vilket innebär att koden "väntar" på att anropet ska bli klart
const database = await mysql.createConnection(dbCredentials);

// Läs in alla filer i mappen frontend/photos som slutar på .jpg eller .jpeg
// Den ska även kunna hantera filer som slutar på .JPG eller .JPEG. Resultatet av koden blir en array av filnamn
// Koden hanterar dock endast jpeg och jpg, inte png eller andra format
// Om vi skulle vilja utveckla applikationen i framtiden skulle vi kunna lägga till stöd för fler format
const files = fs.readdirSync('./frontend/photos/').filter(x => ['.jpg', '.jpeg'].some(ext => x.toLowerCase().endsWith(ext)));

// Nedanför loopar vi igenom alla filer i mappen, för varje fil läser vi in metadata med hjälp av exifr
// Sedan sparar vi metadata i databasen
for (let file of files) {
  let metadataphotos = await exifr.parse('./frontend/photos/' + file);

  // Om metadataphotos är null eller undefined, används en tom {}
  let meta = metadataphotos ?? {};
  // Gör om metadata-objektet till en JSON-sträng
  let json = JSON.stringify(meta);

  // Spara JSON-strängen i databasen
  let [result] = await database.execute(`
    INSERT INTO photo (metaPhotos) VALUES (?)`, [json]);
  // console-loggen är mest för att se att något händer, och se resultatet i terminalen
  // console.log(file, result);
}
// Avsluta programmet när allt är klart
process.exit();
