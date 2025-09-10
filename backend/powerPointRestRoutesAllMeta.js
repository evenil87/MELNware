// Register Rest routes for powerpoint search.
export default function setupPowerPointRestRoutesAllMeta(app, db) {

  app.get('/api/powerPoint-all-meta/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const [result] = await db.execute(`
       SELECT *
      FROM powerPoint
    WHERE id = ?
  `, [id]);

      if (result.length === 0) {
        res.status(404).json({ error: 'PowerPoint not found' });
        return;
      }

      res.json(result[0]);
    } catch (error) {
      console.error('DB error:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });
};