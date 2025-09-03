// Register Rest routes for powerpoint search.
export default function setupPowerPointRestRoute(app, db) {
  // Search powerpoint by title, company, slidecount or creationDate.
  app.get('/api/powerPoint-search/:field/:searchValue', async (req, res) => {
    // Extract field and searchValue from the request parameters.
    const { field, searchValue } = req.params;

    // Collection of valid fields and their corresponding JSON paths.
    const validFields = {
      title: '$.title',
      company: '$.company',
      slides: '$.slideCount',
      date: '$.creationDate'
    };

    // Check if the provided field is valid.
    // Stop processing and return an error if the field is not valid.
    if (!validFields[field]) {
      res.json({ error: 'Invalid field name!' });
      return;
    }

    // SQL query to search powerpoint metadata based on the specified field and search value.
    const query = `
      SELECT 
        id,
        metaPowerPoint->>'$.title' AS title,
        metaPowerPoint->>'$.company' AS company,
        metaPowerPoint->>'$.original' AS link,
        metaPowerPoint->>'$.slideCount' AS slides,
        metaPowerPoint->>'$.creationDate' AS date
      FROM powerPoint
      WHERE LOWER(metaPowerPoint->>'${validFields[field]}') LIKE LOWER(?)
    `;

    // Execute the query with the search value wrapped in wildcards for partial matching.
    const [result] = await db.execute(query, [`%${searchValue}%`]);
    // Return the search results as a JSON response.
    res.json(result);
  });
};


//  app.get('/api/powerPoint/:id', async (req, res) => {
//    const { id } = req.params;

//   try {
//   const [result] = await db.execute(`
//       SELECT *
//      FROM powerPoint
//    WHERE id = ?
//  `, [id]);

//  if (result.length === 0) {
//   res.status(404).json({ error: 'PowerPoint not found' });
//   return;
//  }

//  res.json(result[0]);
//    } catch (error) {
//    console.error('DB error:', error);
//      res.status(500).json({ error: 'Database error' });
//    }
//  });


// Title, creationDate, company, original, slideCount, revisionNumber