// backend/powerPointRestRoutes.js
export default function setupPowerPointRestRoutes(app, db) {
  app.get('/api/powerPointSearch/:field/:searchValue', async (req, res) => {
    const { field, searchValue } = req.params;

    // whitelist fält -> JSON-path
    const validFields = {
      title: '$.title',
      company: '$.company',
      slides: '$.slideCount',
      creationDate: '$.creationDate'
    };

    if (!validFields[field]) {
      res.status(400).json({ error: 'Invalid field name!' });
      return;
    }

    const path = validFields[field];

    // bygg SQL beroende på fält
    let whereClause;
    let orderBy;
    let param;

    if (field === 'creationDate') {
      // prefix-sökning för datum (201 -> 2010-2019)
      whereClause = `metaPowerPoint->>'$.creationDate' LIKE ?`;
      orderBy = `CAST(metaPowerPoint->>'$.creationDate' AS CHAR) ASC`;
      param = `${searchValue}%`; // wildcard bara i slutet
    } else {
      // case-insensitive wildcard före och efter
      whereClause = `LOWER(metaPowerPoint->>'${path}') LIKE LOWER(?)`;
      orderBy = `title ASC`;
      param = `%${searchValue}%`; // wildcard båda sidor
    }

    const query = `
      SELECT
        id,
        metaPowerPoint->>'$.title'        AS title,
        metaPowerPoint->>'$.company'      AS company,
        metaPowerPoint->>'$.slideCount'   AS slides,
        CASE
        WHEN metaPowerPoint->>'$.creationDate' = '1601-01-01 00:00' THEN 'unidentified'
          ELSE metaPowerPoint->>'$.creationDate'
        END                             AS date,
        metaPowerPoint->>'$.fileSize'     AS size,
        metaPowerPoint->>'$.original'     AS URL,
        metaPowerPoint->>'$.fileName'     AS fileName
      FROM powerPoint
      WHERE ${whereClause}
      ORDER BY ${orderBy}
    `;

    try {
      const [rows] = await db.execute(query, [param]);
      res.json(rows);
    } catch (err) {
      console.error('DB error:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });
}
