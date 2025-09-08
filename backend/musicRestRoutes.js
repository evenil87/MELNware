export default function setupMusicRestRoutes(app, db) {

  // Search music by a metadata field
  app.get('/api/music-search/:field/:searchValue', async (req, res) => {
    const { field, searchValue } = req.params;

    // Validate the field to prevent SQL injection
    const validFields = ['title', 'album', 'artist', 'genre'];
    if (!validFields.includes(field)) {
      return res.status(400).json({ error: 'Invalid field name!' });
    }

    try {
      // For genre, we take the first element if it is an array
      const dbField = field === 'genre' 
        ? "metaMusic->>'$.common.genre[0]'" 
        : `metaMusic->>'$.common.${field}'`;

      const [result] = await db.execute(
        `
        SELECT
          id,
          metaMusic->>'$.file' AS fileName,
          metaMusic->>'$.common.title' AS title,
          metaMusic->>'$.common.artist' AS artist,
          metaMusic->>'$.common.album' AS album,
          ${dbField} AS genre
        FROM musicMeta
        WHERE LOWER(${dbField}) LIKE LOWER(?)
        `,
        [`%${searchValue}%`]
      );

      res.json(result);
    } catch (err) {
      console.error('Music search failed:', err);
      res.status(500).json({ error: 'Database query failed' });
    }
  });

  // Get all metadata for a single track by ID
  app.get('/api/music-all-meta/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const [result] = await db.execute(
        `SELECT * FROM musicMeta WHERE id = ?`,
        [id]
      );
      res.json(result);
    } catch (err) {
      console.error('Get music metadata failed:', err);
      res.status(500).json({ error: 'Database query failed' });
    }
  });
}
