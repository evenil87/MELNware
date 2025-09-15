import path from 'path';
import fs from 'fs/promises';

export default function setupPowerPointDownloadRoute(app, db) {
  const PPT_DIR = path.resolve('frontend/powerPoint');

  function safeJoin(fileName) {
    const full = path.resolve(PPT_DIR, fileName);
    if (!full.startsWith(PPT_DIR + path.sep)) return null;
    return full;
  }

  // /api/powerPoint-download/:id hämtar filnamnet från DB och skickar filen
  app.get('/api/powerPoint-download/:id', async (req, res) => {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) {
      res.status(400).json({ error: 'Invalid id parameter' });
      return;
    }

    // hämta filnamn ur databasen
    const [rows] = await db.execute(
      `SELECT JSON_UNQUOTE(JSON_EXTRACT(metaPowerPoint, '$.fileName')) AS fileName
       FROM powerPoint
       WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'PowerPoint not found' });
      return;
    }

    const fileName = rows[0].fileName;
    const fullPath = safeJoin(fileName);
    if (!fullPath) {
      res.status(400).json({ error: 'Invalid file path' });
      return;
    }

    try {
      await fs.access(fullPath);
      res.download(fullPath, fileName);
    } catch (err) {
      res.status(404).json({ error: 'File not found on server' });
    }
  });
}
