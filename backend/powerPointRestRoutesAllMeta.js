// backend/powerPointRestRoutesAllMeta.js
export default function setupPowerPointRestRoutesAllMeta(app, db) {
  // Hämta all metadata för en specifik PowerPoint baserat på dess ID
  app.get('/api/powerPoint-all-meta/:id', async (req, res) => {
    const { id } = req.params;

    // SQL-frågan för att hämta all metadata
    try {
      const [result] = await db.execute(`
       SELECT *
      FROM powerPoint
    WHERE id = ?
  `, [id]);
      // Kontrollera om någon PowerPoint hittades med det angivna ID:t 
      if (result.length === 0) {
        res.status(404).json({ error: 'PowerPoint not found' });
        return;
      }
      // Skicka tillbaka den första (och enda) posten som hittades
      res.json(result[0]);
    } catch (error) {
      console.error('DB error:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });
};