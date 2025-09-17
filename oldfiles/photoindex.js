import fs from 'fs';
import exifr from 'exifr';

let files = fs.readdirSync('./frontend/photos/')
  .filter(x => ['.jpg', '.jpeg'].some(ext => x.toLowerCase().endsWith(ext)));

let metadataList = [];

for (let file of files) {
  let metadata = await exifr.parseFile('./frontend/photos/' + file);
  metadataList.push({ file, metadata });
}

let json = JSON.stringify(metadataList, null, 2);

console.log(metadataList);

fs.writeFileSync('./metadataphotos.json', json, 'utf-8');


/*
const result = rows.map(row => ({
  ...row,
  metadata: {
    latitude: row.latitude,
    longitude: row.longitude
  }
}));
*/
