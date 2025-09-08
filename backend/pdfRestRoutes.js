export default function setupPdfRestRoutes(app, db) {

  app.get('/api/pdf-search/:field/:searchValue', async (req, res) => {
    // get field and searhValue from the request parameters
    const { field, searchValue } = req.params;
    // check that field is a valid field, if not do nothing
    if (!['title', 'author', 'creator', 'date', 'numpages'].includes(field)) {
      res.json({ error: 'Invalid field name!' });
      return;
    }

    const queryPath =
      field === 'numpages'
        ? "metaPdf->>'$.numpages'"
        : field === 'date'
        ? "metaPdf->>'$.info.CreationDate'"
        : `metaPdf->>'$.info.${field.charAt(0).toUpperCase() + field.slice(1)}'`;



    const [result] = await db.execute(`
  SELECT id,
         metaPdf->>'$.file' AS fileName,
         metaPdf->>'$.info.Title'   AS title,
         metaPdf->>'$.info.Author'  AS author,
         metaPdf->>'$.info.Creator' AS creator,
         SUBSTRING(metaPdf->>'$.info.CreationDate', 3, 4) AS year,
         SUBSTRING(metaPdf->>'$.info.CreationDate', 7, 2) AS month,
         SUBSTRING(metaPdf->>'$.info.CreationDate', 9, 2) AS day,
         metaPdf->>'$.numpages'     AS pages
  FROM pdf
  WHERE LOWER(${queryPath}) LIKE LOWER(?)
`, ['%' + searchValue + '%']);

    // return the result as json
    res.json(result);
  });

  // get all metadata for a single pdf (by id)
  app.get('/api/pdf-all-meta/:id', async (req, res) => {
    const { id } = req.params;
    let [result] = await db.execute(`
    SELECT * FROM pdf WHERE id = ?
  `, [id]);
    res.json(result[0] || {});
  });

  // Filter by year range
  app.get('/api/pdf-filter/year', async (req, res) => {
    const { start, end } = req.query;
    let[result] = await db.execute(`
  SELECT id,
  metaPdf->>'$.file' AS fileName,
  metaPdf->>'$.info.Title'   AS title,
  metaPdf->>'$.info.Author'  AS author,
  metaPdf->>'$.info.Creator' AS creator,
  SUBSTRING(metaPdf->>'$.info.CreationDate', 3, 4) AS year,
  SUBSTRING(metaPdf->>'$.info.CreationDate', 7, 2) AS month,
  SUBSTRING(metaPdf->>'$.info.CreationDate', 9, 2) AS day,
  metaPdf->>'$.numpages'     AS pages
  FROM pdf
  WHERE CAST(SUBSTRING(metaPdf->>'$.info.CreationDate', 3, 4) AS UNSIGNED)
BETWEEN ? AND ?
ORDER BY year
`, [start, end]);
    res.json(result);
  });

  // Filter by page count
  app.get('/api/pdf-filter/pages', async (req, res) => {
    const { pages } = req.query;
    let condition = '';
    if (pages === 'short') {
      condition = "CAST(metaPdf->>'$.numpages' AS UNSIGNED) < 5";
    } else if (pages === 'medium') {
      condition = "CAST(metaPdf->>'$.numpages' AS UNSIGNED) BETWEEN 5 AND 50";
    } else if (pages === 'long') {
      condition = "CAST(metaPdf->>'$.numpages' AS UNSIGNED) > 50";
    }
    let [result] = await db.execute(`
      SELECT id,
             metaPdf->>'$.file' AS fileName,
             metaPdf->>'$.info.Title'   AS title,
             metaPdf->>'$.info.Author'  AS author,
             metaPdf->>'$.info.Creator' AS creator,
             SUBSTRING(metaPdf->>'$.info.CreationDate', 3, 4) AS year,
             SUBSTRING(metaPdf->>'$.info.CreationDate', 7, 2) AS month,
             SUBSTRING(metaPdf->>'$.info.CreationDate', 9, 2) AS day,
             metaPdf->>'$.numpages'     AS pages
      FROM pdf
      WHERE ${condition}
      ORDER BY pages
    `);
    res.json(result);
  });

  // Filter by year + page count
  app.get('/api/pdf-filter/combined', async (req, res) => {
    const { year, pages } = req.query;
    let conditions = [];
    let values = [];

    if (year) {
      conditions.push("CAST(SUBSTRING(metaPdf->>'$.info.CreationDate', 3, 4) AS UNSIGNED) = ?");
      values.push(year);
    }

    if (pages === 'short') {
      conditions.push("CAST(metaPdf->>'$.numpages' AS UNSIGNED) < 5");
    } else if (pages === 'medium') {
      conditions.push("CAST(metaPdf->>'$.numpages' AS UNSIGNED) BETWEEN 5 AND 50");
    } else if (pages === 'long') {
      conditions.push("CAST(metaPdf->>'$.numpages' AS UNSIGNED) > 50");
    }

    let whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    let [result] = await db.execute(`
      SELECT id,
             metaPdf->>'$.file' AS fileName,
             metaPdf->>'$.info.Title'   AS title,
             metaPdf->>'$.info.Author'  AS author,
             metaPdf->>'$.info.Creator' AS creator,
             SUBSTRING(metaPdf->>'$.info.CreationDate', 3, 4) AS year,
             SUBSTRING(metaPdf->>'$.info.CreationDate', 7, 2) AS month,
             SUBSTRING(metaPdf->>'$.info.CreationDate', 9, 2) AS day,
             metaPdf->>'$.numpages'     AS pages
      FROM pdf
      ${whereClause}
      ORDER BY year, pages
    `, values);

    res.json(result);
  });

}