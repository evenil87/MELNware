export default function setupImageRestRoutes(app, db) {

  app.get('/api/images-search/:field/:searchValue', async (req, res) => {
    // get field and searhValue from the request parameters
    const { field, searchValue } = req.params;
    // check that field is a valid field, if not do nothing
    if (!['file', 'Make', 'CreateDate'].includes(field)) {
      res.json({ error: 'Invalid field name!' });
      return;
    }

    const [result] = await db.execute(`
  SELECT id,
         metaPhoto->>'$.file' AS FileName,
         metaPhoto->>'$.metadata.Make' AS Creator,
         metaPhoto->>'$.metadata.CreateDate' AS CreationDate
  FROM photo
  WHERE LOWER(${queryPath}) LIKE LOWER(?)
`, ['%' + searchValue + '%']);

    // return the result as json
    res.json(result);
  });

  // get all metadata for a specific image by id
  app.get('/api/images-all-meta/:id', async (req, res) => {
    const { id } = req.params;
    let [result] = await db.execute(`
    SELECT * FROM photo WHERE id = ?
  `, [id]);
    res.json(result[0] || {});
  });

}