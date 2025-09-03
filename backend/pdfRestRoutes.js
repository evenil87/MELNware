export default function setupPdfRestRoutes(app, db) {

  app.get('/api/pdf-search/:field/:searchValue', async (req, res) => {
    // get field and searhValue from the request parameters
    const { field, searchValue } = req.params;
    // check that field is a valid field, if not do nothing
    if (!['title', 'author', 'creator', 'numpages'].includes(field)) {
      res.json({ error: 'Invalid field name!' });
      return;
    }

    const queryPath = field === 'numpages'
      ? "metaPdf->>'$.numpages'"
      : `metaPdf->>'$.common.${field}'`;

    const [result] = await db.execute(`
  SELECT id,
         metaPdf->>'$.file' AS fileName,
         metaPdf->>'$.common.title' AS title,
         metaPdf->>'$.common.author' AS author,
         metaPdf->>'$.common.creator' AS creator,
         metaPdf->>'$.numpages' AS numpages
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

}