import fs from 'fs';
import * as mm from 'music-metadata';
import path from 'path';

// Hardcoded absolute path to your music folder
const musicPath = 'C:/Users/Eveli/Documents/GitHub/MELNware/frontend/music';

// Check if the music folder exists
if (!fs.existsSync(musicPath)) {
  console.error('Music folder not found:', musicPath);
  process.exit(1);
}

// Recursive function to get all music files in folder and subfolders
function getAllMusicFiles(dir) {
  let results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (let item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(getAllMusicFiles(fullPath)); // Recurse into subfolder
    } else if (
      item.name.endsWith('.mp3') ||
      item.name.endsWith('.flac') ||
      item.name.endsWith('.wav') ||
      item.name.endsWith('.m4a')
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

// Get all music files
const files = getAllMusicFiles(musicPath);

let metadataList = [];

async function extractMusicMetadata() {
  for (let filePath of files) {
    try {
      const metadata = await mm.parseFile(filePath);
      const relativePath = path.relative(musicPath, filePath); // store relative path
      metadataList.push({
        file: relativePath,
        common: metadata.common,
        format: metadata.format
      });
    } catch (err) {
      console.error('Error reading', filePath, err.message);
    }
  }

  // Save metadata to JSON file
  const outPath = path.join('C:/Users/Eveli/Documents/GitHub/MELNware', 'music-metadata.json');
  fs.writeFileSync(outPath, JSON.stringify(metadataList, null, 2), 'utf-8');

  console.log('Metadata extraction done');
  console.log('Files processed:', metadataList.length);
}

// Run the function
extractMusicMetadata();
