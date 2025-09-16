export default function setupImageRestRoutes(app, db) {

  app.get('/api/image-search/:field/:searchValue', async (req, res) => {
    // get field and searhValue from the request parameters
    const { field, searchValue } = req.params;
    // check that field is a valid field, if not do nothing
    const validFields = {
      all: 'all',
      file: '$.file',
      make: '$.metadata.Make',
      date: '$.metadata.CreateDate',
      fileSource: '$.metadata.FileSource',
      flash: '$.metadata.Flash',
      latitude: '$.metadata.latitude',
      longitude: '$.metadata.longitude'
    };

    if (!validFields[field]) {
      res.json({ error: 'Invalid field name!' });
      return;
    }
    // sök 'all'
    let rows;
    if (field === 'all') {
      const like = '%' + searchValue + '%';
    [rows] = await db.execute(`
  SELECT id,
         metaPhoto->>'$.file' AS File,
         metaPhoto->>'$.metadata.Make' AS Creator,
         metaPhoto->>'$.metadata.CreateDate' AS Date,
         metaPhoto->>'$.metadata.FileSource' AS FileSource,
         metaPhoto->>'$.metadata.Flash' AS Flash,
         metaPhoto->>'$.metadata.latitude' AS latitude,
         metaPhoto->>'$.metadata.longitude' AS longitude
  FROM photo
        WHERE LOWER(metaPhoto->>'$.file') LIKE LOWER(?)
           OR LOWER(metaPhoto->>'$.metadata.Make') LIKE LOWER(?)
           OR LOWER(metaPhoto->>'$.metadata.CreateDate') LIKE LOWER(?)
           OR LOWER(metaPhoto->>'$.metadata.FileSource') LIKE LOWER(?)
           OR LOWER(metaPhoto->>'$.metadata.Flash') LIKE LOWER(?)
      `, [like, like, like, like, like]);
    } else {
      [rows] = await db.execute(`
        SELECT id,
               metaPhoto->>'$.file' AS File,
               metaPhoto->>'$.metadata.Make' AS Creator,
               metaPhoto->>'$.metadata.CreateDate' AS Date,
               metaPhoto->>'$.metadata.FileSource' AS FileSource,
               metaPhoto->>'$.metadata.Flash' AS Flash,
               metaPhoto->>'$.metadata.latitude' AS latitude,
               metaPhoto->>'$.metadata.longitude' AS longitude
        FROM photo
        WHERE LOWER(metaPhoto->>'${validFields[field]}') LIKE LOWER(?)
      `, ['%' + searchValue + '%']);
    }

    const result = rows.map(row => {
      // formatera datum
      let formattedDate = row.Date;
      if (formattedDate) {
        try {
          formattedDate = new Date(formattedDate).toISOString().slice(0, 10);
        } catch (e) {
          // om det inte går, låt det vara som det är
        }
      }

      // returnera objektet med metadata och formaterat datum
      return {
        ...row,
        Date: formattedDate,
        metadata: {
          latitude: row.latitude,
          longitude: row.longitude
        }
      };
    });


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
}
