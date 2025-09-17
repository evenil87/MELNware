// backend/powerPointRestRoutes.js
export default function setupPowerPointRestRoutes(app, db) {
  app.get('/api/powerPointSearch/:field/:searchValue', async (req, res) => {
    const { field, searchValue } = req.params;

    // Validera fältet som söks på
    const validFields = {
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

    const path = validFields[field];

    // Bygg SQL-frågan baserat på fältet
    let whereClause;
    let orderBy;
    let param;

    // Speciell hantering för creationDate (ingen wildcard i början)
    if (field === 'creationDate') {
      whereClause = `metaPowerPoint->>'$.creationDate' LIKE ?`;
      orderBy = `CAST(metaPowerPoint->>'$.creationDate' AS CHAR) ASC`;
      param = `${searchValue}%`; // Wildcard i slutet
    } else {
      // Hantering för andra fält
      whereClause = `LOWER(metaPowerPoint->>'${path}') LIKE LOWER(?)`;
      orderBy = `title ASC`;
      param = `%${searchValue}%`; // Wildcard båda sidor
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
      const [rows] = await db.execute(query, [param]);
      res.json(rows);
    } catch (err) {
      console.error('DB error:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });
}
