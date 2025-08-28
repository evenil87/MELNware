// Import the file system module (fs)
import fs from 'fs';

// Read JSON from file.
let json = fs.readFileSync('./powerPointJsonFromCsv.json', 'utf-8');
let data = JSON.parse(json);

// Converts snake_case to camelCase.
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

// Converts keys recursively.
function convertKeysToCamelCase(obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => convertKeysToCamelCase(item));
  } else if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).reduce((acc, key) => {
      const newKey = toCamelCase(key);
      acc[newKey] = convertKeysToCamelCase(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

// Tidy up dates (removes T, Z and seconds).
function cleanDate(dateStr) {
  if (typeof dateStr === "string" && dateStr.includes("T")) {
    let cleaned = dateStr.replace("T", " ").replace("Z", "");
    return cleaned.slice(0, 16); // yyyy-mm-dd hh:mm
  }
  return dateStr;
}

// Process all objects in JSON.
let cleanedData = data.map(powerpointMetadata => {
  // Extract filename.
  let fileName = powerpointMetadata.digest + '.ppt';

  // Remove unnecessary fields.
  delete powerpointMetadata.digest;
  delete powerpointMetadata.sha256;
  delete powerpointMetadata.sha512;
  delete powerpointMetadata.timestamp;
  delete powerpointMetadata.urlkey;
  delete powerpointMetadata.revision;

  // Converts keys to camelCase. 
  let converted = convertKeysToCamelCase(powerpointMetadata);

  // Fix dates (creationDate and lastModified).
  if (converted.creationDate) {
    converted.creationDate = cleanDate(converted.creationDate);
  }
  if (converted.lastModified) {
    converted.lastModified = cleanDate(converted.lastModified);
  }

  console.log('');
  console.log(fileName);
  console.log(converted);

  return { fileName, ...converted };
});

// Save as new JSON file.
fs.writeFileSync('./powerPointJsonCleaned.json', JSON.stringify(cleanedData, null, 2), 'utf-8');

console.log('Ny fil sparad som powerPointJsonCleaned.json');
