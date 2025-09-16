export default function setupMusicRestRoutes(app, db) {

  // Music search API
  app.get('/api/music-search/:field/:searchValue', async (req, res) => {
    const { field, searchValue } = req.params;

    if (!['all', 'title', 'album', 'artist', 'genre'].includes(field)) {
      return res.status(400).json({ error: 'Invalid field name!' });
    }

    try {
      // Search multiple fields if "all"
      if (field === 'all') {
        const like = `%${searchValue}%`;
      const [result] = await db.execute(
        `SELECT id,
           metaMusic->>'$.file' AS fileName,
           metaMusic->>'$.common.title' AS title,
           metaMusic->>'$.common.artist' AS artist,
           metaMusic->>'$.common.album' AS album,
           metaMusic->>'$.common.genre[0]' AS genre,
           metaMusic->>'$.common.year' AS year
FROM music
           WHERE LOWER(metaMusic->>'$.common.title')  LIKE LOWER(?)
              OR LOWER(metaMusic->>'$.common.artist') LIKE LOWER(?)
              OR LOWER(metaMusic->>'$.common.album')  LIKE LOWER(?)
              OR LOWER(metaMusic->>'$.common.genre[0]') LIKE LOWER(?)`,
        [like, like, like, like]
      );
        return res.json(result);
      }

      // or search in chosen field
      const [result] = await db.execute(
        `SELECT id,
           metaMusic->>'$.file' AS fileName,
           metaMusic->>'$.common.title' AS title,
           metaMusic->>'$.common.artist' AS artist,
           metaMusic->>'$.common.album' AS album,
           metaMusic->>'$.common.genre[0]' AS genre,
           metaMusic->>'$.common.year' AS year
         FROM music
         WHERE LOWER(metaMusic->>'$.common.${field}') LIKE LOWER(?)`,
        [`%${searchValue}%`]
      );

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Get full metadata for a single track
  app.get('/api/music-all-meta/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const [result] = await db.execute(
        `SELECT * FROM music WHERE id = ?`, [id]
      );
      res.json(result[0] || {});
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  });
}
