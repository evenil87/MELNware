// restroutes for a new page: global search
export default function setupGlobalSearchRoutes(app, db) {
  app.get('/api/global-search/:query', async (req, res) => {
    try {
      const { query } = req.params;
      const like = `%${query}%`;

      // Photo
      const [photoRows] = await db.execute(
        `SELECT COUNT(*) AS count 
         FROM photo 
         WHERE JSON_SEARCH(LOWER(metaPhoto), 'all', LOWER(?)) IS NOT NULL`,
        [like]
      );

      // PDF
      const [pdfRows] = await db.execute(
        `SELECT COUNT(*) AS count 
         FROM pdf 
         WHERE JSON_SEARCH(LOWER(metaPdf), 'all', LOWER(?)) IS NOT NULL`,
        [like]
      );

      // Music
      const [musicRows] = await db.execute(
        `SELECT COUNT(*) AS count 
         FROM music 
         WHERE JSON_SEARCH(LOWER(metaMusic), 'all', LOWER(?)) IS NOT NULL`,
        [like]
      );

      // PowerPoint
      const [pptRows] = await db.execute(
        `SELECT COUNT(*) AS count 
         FROM powerPoint 
         WHERE JSON_SEARCH(LOWER(metaPowerPoint), 'all', LOWER(?)) IS NOT NULL`,
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