// restroutes for a new page: global search
export default function setupGlobalSearchRoutes(app, db) {
  app.get('/api/global-search/:query', async (req, res) => {
    try {
      const { query } = req.params;
      const like = `%${query}%`;

      // Photo
      const [photoRows] = await db.execute(
        `SELECT COUNT(*) AS count FROM photo 
         WHERE LOWER(metaPhoto->>'$.file') LIKE LOWER(?)
            OR LOWER(metaPhoto->>'$.metadata.Make') LIKE LOWER(?)`,
        [like, like]
      );

      // PDF
      const [pdfRows] = await db.execute(
        `SELECT COUNT(*) AS count FROM pdf 
         WHERE LOWER(metaPdf->>'$.info.Title') LIKE LOWER(?)
            OR LOWER(metaPdf->>'$.info.Author') LIKE LOWER(?)`,
        [like, like]
      );

      // Music
      const [musicRows] = await db.execute(
        `SELECT COUNT(*) AS count FROM music 
         WHERE LOWER(metaMusic->>'$.common.title') LIKE LOWER(?)
            OR LOWER(metaMusic->>'$.common.artist') LIKE LOWER(?)`,
        [like, like]
      );

      // PowerPoint
      const [pptRows] = await db.execute(
        `SELECT COUNT(*) AS count FROM powerPoint 
         WHERE LOWER(metaPowerPoint->>'$.title') LIKE LOWER(?)`,
        [like]
      );

      res.json({
        photo: photoRows[0].count,
        pdf: pdfRows[0].count,
        music: musicRows[0].count,
        powerpoint: pptRows[0].count
      });
    } catch (err) {
      console.error('Global search error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
}
