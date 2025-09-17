// skapar en funktion som sätter upp våra rest-api routes för bilder
export default function setupImageRestRoutes(app, db) {

  app.get('/api/image-search/:field/:searchValue', async (req, res) => {
    // hitta ut field och searchValue från req.params
    const { field, searchValue } = req.params;

    // kolla så att field är ett av de tillåtna värdena
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

    // om field inte är giltigt, returnera ett felmeddelande
    if (!validFields[field]) {
      res.json({ error: 'Invalid field name!' });
      return;
    }
    // nedan börjar vi bygga sql-frågan som ska kunnas användas för att söka genom alla metadatafält
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
      // formatera datum så det inte ser helt galet ut för användaren
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


    // retunera sökresultaten som json
    res.json(result);
  });

  // Hitta all metadata för en bild med ett visst id
  app.get('/api/image-all-meta/:id', async (req, res) => {
    const { id } = req.params;
    let [result] = await db.execute(`
    SELECT * FROM photo WHERE id = ?
  `, [id]);
    res.json(result[0] || {});
  });
}
