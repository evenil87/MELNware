// Exporterar en funktion som sätter upp REST API-rutter för musik
export default function setupMusicRestRoutes(app, db) {

  // Musik-sök API
  app.get('/api/music-search/:field/:searchValue', async (req, res) => {
    const { field, searchValue } = req.params;

    // Kontrollera att fältet är giltigt
    if (!['all', 'title', 'album', 'artist', 'genre'].includes(field)) {
      return res.status(400).json({ error: 'Ogiltigt fältnamn!' });
    }

    try {
      // Om "all" ska vi söka i flera fält
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

      // Sök i valt fält
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
      // Felhantering vid databasproblem
      res.status(500).json({ error: 'Databasfel' });
    }
  });

  // Hämta all metadata för en låt
  app.get('/api/music-all-meta/:id', async (req, res) => {
    const { id } = req.params;

    try {
      // Hämta raden med specificerat ID
      const [result] = await db.execute(
        `SELECT * FROM music WHERE id = ?`, [id]
      );
      // Returnera första (och enda) raden som JSON
      res.json(result[0] || {});
    } catch (err) {
      console.error(err);
      // Felhantering vid databasproblem
      res.status(500).json({ error: 'Databasfel' });
    }
  });
}
