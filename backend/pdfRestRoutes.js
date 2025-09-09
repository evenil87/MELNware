export default function setupPdfRestRoutes(app, db) {

  app.get('/api/pdf-search/:field/:searchValue', async (req, res) => {
    const { field, searchValue } = req.params;

    // allow search in 'all'
    if (!['all', 'title', 'author', 'creator', 'date', 'numpages'].includes(field)) {
      res.json({ error: 'Invalid field name!' });
      return;
    }

    // search both title and author ('all')
    if (field === 'all') {
      const like = '%' + searchValue + '%';
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
    WHERE LOWER(metaPdf->>'$.info.Title')  LIKE LOWER(?)
       OR LOWER(metaPdf->>'$.info.Author') LIKE LOWER(?)
  `, [like, like]);
      res.json(result);
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

    res.json(result);
  });


  // get all metadata for a single pdf (by id)
  app.get('/api/pdf-all-meta/:id', async (req, res) => {
    const { id } = req.params;
    let [result] = await db.execute(`SELECT * FROM pdf WHERE id = ?`, [id]);
    res.json(result[0] || {});
  });

}