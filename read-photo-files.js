import fs from 'fs';
import exifr from 'exifr';

let files = fs.readdirSync('.frontend/photos').filter(file => file.endsWith('.jpg') || file.endsWith('.jpeg'));

let metadataList = [];

for (let file of files) {
  let metadataList = await exifr.parse(`.fronted/photos/${file}`);
  metadataList.push({ file, metadata });
}

console.log(metadataList);

let json = JSON.stringify(metadataList, null, '');

fs.writeFileSync('.frontend/photos/metadata.json', json, 'utf-8');
