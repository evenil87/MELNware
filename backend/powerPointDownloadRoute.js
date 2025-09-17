// backend/powerPointDownloadRoute.js
import path from 'path';
import fs from 'fs/promises';

// Route för att ladda ner PowerPoint-filer baserat på deras ID
export default function setupPowerPointDownloadRoute(app, db) {
  // Katalog där PowerPoint-filerna finns
  const PPT_DIR = path.resolve('frontend/powerPoint');

  // Säker join för att undvika attack via sökvägar (Directory Traversal) 
  function safeJoin(fileName) {
    const full = path.resolve(PPT_DIR, fileName);
    if (!full.startsWith(PPT_DIR + path.sep)) return null;
    return full;
  }
  // Route för att ladda ner filen
  app.get('/api/powerPoint-download/:id', async (req, res) => {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) {
      res.status(400).json({ error: 'Invalid id parameter' });
      return;
    }

    // Hämta filnamnet från databasen
    const [rows] = await db.execute(
      `SELECT JSON_UNQUOTE(JSON_EXTRACT(metaPowerPoint, '$.fileName')) AS fileName
       FROM powerPoint
       WHERE id = ?`,
      [id]
    );

    // Om ingen rad hittas, skicka 404
    if (rows.length === 0) {
      res.status(404).json({ error: 'PowerPoint not found' });
      return;
    }

    // Säkerställ att filen finns och skicka den
    const fileName = rows[0].fileName;
    const fullPath = safeJoin(fileName);
    if (!fullPath) {
      res.status(400).json({ error: 'Invalid file path' });
      return;
    }

    // Kontrollera att filen finns på servern innan nedladdning 
    try {
      await fs.access(fullPath);
      res.download(fullPath, fileName);
    } catch (err) {
      res.status(404).json({ error: 'File not found on server' });
    }
  });
}
