import fs from 'fs';
import exifr from 'exifr';

let files = fs.readdirSync('./frontend/photos/').filter(x => x.endsWith('.jpg') || x.endsWith('.jpeg'));

let metadataList = [];

for (let file of files) {
  let metadata = await exifr.parse('./frontend/photos/' + file);
  metadataList.push({ file, metadata });
}

let json = JSON.stringify(files, null, ' ');

console.log(metadataList);
console.log(json);

fs.writeFileSync('./metadataphotos.json', json, 'utf-8');
