// backend/powerPointRestRoutes.js
export default function setupPowerPointRestRoutes(app, db) {
  app.get('/api/powerPointSearch/:field/:searchValue', async (req, res) => {
    const { field, searchValue } = req.params;
    const { from, to, minSlides, maxSlides } = req.query;

    // Validera fältet
    const validFields = {
      all: 'all',
      title: '$.title',
      company: '$.company',
      slides: '$.slideCount',
      creationDate: '$.creationDate'
    };

    // Om fältet inte är giltigt, skicka felmeddelande
    if (!validFields[field]) {
      res.status(400).json({ error: 'Invalid field name!' });
      return;
    }

    // Bygg WHERE-klausuler och parametrar för SQL-frågan
    let whereClauses = [];
    let params = [];

    // Sök på valda fält
    if (field === 'all') {
      const like = `%${searchValue}%`;
      whereClauses.push(`(
        LOWER(metaPowerPoint->>'$.title') LIKE LOWER(?)
        OR LOWER(metaPowerPoint->>'$.company') LIKE LOWER(?)
        OR metaPowerPoint->>'$.creationDate' LIKE ?
        OR CAST(metaPowerPoint->>'$.slideCount' AS CHAR) LIKE ?
      )`);
      params.push(like, like, like, like);
    } else if (field === 'creationDate') {
      whereClauses.push(`metaPowerPoint->>'$.creationDate' LIKE ?`);
      params.push(`${searchValue}%`);
    } else if (field === 'slides') {
      whereClauses.push(`CAST(metaPowerPoint->>'$.slideCount' AS CHAR) LIKE ?`);
      params.push(`%${searchValue}%`);
    } else {
      const path = validFields[field];
      whereClauses.push(`LOWER(metaPowerPoint->>'${path}') LIKE LOWER(?)`);
      params.push(`%${searchValue}%`);
    }

    // Avancerade filter 
    if (from) {
      whereClauses.push(`metaPowerPoint->>'$.creationDate' >= ?`);
      params.push(from);
    }
    if (to) {
      whereClauses.push(`metaPowerPoint->>'$.creationDate' <= ?`);
      params.push(to);
    }
    if (minSlides) {
      whereClauses.push(`CAST(metaPowerPoint->>'$.slideCount' AS UNSIGNED) >= ?`);
      params.push(minSlides);
    }
    if (maxSlides) {
      whereClauses.push(`CAST(metaPowerPoint->>'$.slideCount' AS UNSIGNED) <= ?`);
      params.push(maxSlides);
    }

    const whereSQL = whereClauses.join(' AND ');

    const query = `
      SELECT
        id,
        metaPowerPoint->>'$.title' AS title,
        metaPowerPoint->>'$.company' AS company,
        metaPowerPoint->>'$.slideCount' AS slides,
        metaPowerPoint->>'$.creationDate' AS date,
        metaPowerPoint->>'$.fileSize' AS size,
        metaPowerPoint->>'$.original' AS URL,
        metaPowerPoint->>'$.fileName' AS fileName
      FROM powerPoint
      WHERE ${whereSQL}
      ORDER BY title ASC
    `;

    // Genomför frågan och skicka resultatet
    try {
      const [rows] = await db.execute(query, params);
      res.json(rows);
    } catch (err) {
      console.error('DB error:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });
}
