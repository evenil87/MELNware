// Importerar nödvändiga moduler
import fs from 'fs';

// Läs JSON från fil med felhantering
let data;
try {
  const json = fs.readFileSync('./frontend/powerPoint/csvjson.json', 'utf-8');
  data = JSON.parse(json);
} catch (err) {
  console.error('Could not read of PARSE the file:', err);
  process.exit(1);
}

// Omvandlar snake_case till camelCase
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

// Konverterar alla keys i ett objekt (och dess barn) till camelCase
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

// Rensar datum: tar bort T, Z och sekunder om de finns
function cleanDate(dateStr) {
  if (typeof dateStr !== 'string') return dateStr;

  try {
    const date = new Date(dateStr);
    if (!isNaN(date)) {
      // yyyy-mm-dd hh:mm
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const hh = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    }
  } catch (e) {
    // fallback till originalsträng om parsing misslyckas
  }
  return dateStr.replace("T", " ").replace("Z", "").slice(0, 16);
}

// Bearbeta alla objekt i JSON
const cleanedData = data.map(item => {
  // Filnamn
  const fileName = item.digest ? `${item.digest}.ppt` : 'unknown.ppt';

  // Ta bort onödiga fält
  const fieldsToDelete = ['sha256', 'sha512', 'timestamp', 'urlkey', 'revision'];
  fieldsToDelete.forEach(f => delete item[f]);

  // Konvertera keys till camelCase
  const converted = convertKeysToCamelCase(item);

  // Rensa datum
  if (converted.creationDate) converted.creationDate = cleanDate(converted.creationDate);
  if (converted.lastModified) converted.lastModified = cleanDate(converted.lastModified);

  console.log('\n', fileName, converted);

  return { fileName, ...converted };
});

// Spara som ny JSON-fil
try {
  fs.writeFileSync(
    './frontend/powerPoint/powerPointJsonCleaned.json',
    JSON.stringify(cleanedData, null, 2),
    'utf-8'
  );
  console.log('New file saved as powerPointJsonCleaned.json');
} catch (err) {
  console.error('Could not save the file:', err);
}
