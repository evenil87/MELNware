// backend/powerPointRestRoutes.js
export default function setupPowerPointRestRoutes(app, db) {
  app.get('/api/powerPointSearch/:field/:searchValue', async (req, res) => {
    const { field, searchValue } = req.params;

    // Validera fältet som söks på
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

    let whereClause;
    let orderBy;
    let params;

    if (field === 'all') {
      // Sök i title, company, creationDate och slides
      const like = `%${searchValue}%`;
      whereClause = `(
        LOWER(metaPowerPoint->>'$.title') LIKE LOWER(?)
        OR LOWER(metaPowerPoint->>'$.company') LIKE LOWER(?)
        OR metaPowerPoint->>'$.creationDate' LIKE ?
        OR CAST(metaPowerPoint->>'$.slideCount' AS CHAR) LIKE ?
      )`;
      orderBy = `title ASC`;
      params = [like, like, like, like];
    } else if (field === 'creationDate') {
      // Speciell hantering för creationDate (ingen wildcard i början)
      whereClause = `metaPowerPoint->>'$.creationDate' LIKE ?`;
      orderBy = `CAST(metaPowerPoint->>'$.creationDate' AS CHAR) ASC`;
      params = [`${searchValue}%`]; // Wildcard i slutet
    } else if (field === 'slides') {
      // Sök i slideCount (som text) med wildcard på båda sidor
      whereClause = `CAST(metaPowerPoint->>'$.slideCount' AS CHAR) LIKE ?`;
      orderBy = `title ASC`;
      params = [`%${searchValue}%`];
    } else {
      // Hantering för title/company
      const path = validFields[field];
      whereClause = `LOWER(metaPowerPoint->>'${path}') LIKE LOWER(?)`;
      orderBy = `title ASC`;
      params = [`%${searchValue}%`];
    }

    // SQL-frågan
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
      WHERE ${whereClause}
      ORDER BY ${orderBy}
    `;

    // Kör frågan och skicka resultatet
    try {
      const [rows] = await db.execute(query, params);
      res.json(rows);
    } catch (err) {
      console.error('DB error:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });
}