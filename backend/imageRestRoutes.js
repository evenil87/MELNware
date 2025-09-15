export default function setupImageRestRoutes(app, db) {

  app.get('/api/image-search/:field/:searchValue', async (req, res) => {
    // get field and searhValue from the request parameters
    const { field, searchValue } = req.params;
    // check that field is a valid field, if not do nothing
    const validFields = {
      file: '$.file',
      make: '$.metadata.Make',
      date: '$.metadata.CreateDate',
      fileSource: '$.metadata.FileSource',
      flash: '$.metadata.Flash'
    };

    if (!validFields[field]) {
      res.json({ error: 'Invalid field name!' });
      return;
    }

    const [result] = await db.execute(`
  SELECT id,
         metaPhoto->>'$.file' AS File,
         metaPhoto->>'$.metadata.Make' AS Creator,
         metaPhoto->>'$.metadata.CreateDate' AS Date,
         metaPhoto->>'$.metadata.FileSource' AS FileSource,
         metaPhoto->>'$.metadata.Flash' AS Flash
  FROM photo
  WHERE LOWER(metaPhoto->>'${validFields[field]}') LIKE LOWER(?)
`, ['%' + searchValue + '%']);

    // return the result as json
    res.json(result);
  });

  // get all metadata for a specific image by id
  app.get('/api/image-all-meta/:id', async (req, res) => {
    const { id } = req.params;
    let [result] = await db.execute(`
    SELECT * FROM photo WHERE id = ?
  `, [id]);
    res.json(result[0] || {});
  });

  app.get('/api/images', async (req, res) => {
    let data = await fetch('/api/images');
    let images = await data.json();
    let html = '';
    for (let image of images) {
      let { latitude, longitude } = image.metadata;
      html += `<section>
      <a href="https://maps.google.com/?q=${image.metadata.latitude},${image.metadata.longitude}" target="_blank">
        <img src="/images/${image.fileName}" alt="Arable land at latitude ${latitude}, longitude ${longitude}">
      </a>
    </section>`;
    }
    document.querySelector('article').innerHTML = html;
  });
}