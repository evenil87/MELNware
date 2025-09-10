// Register Rest routes for powerpoint search.
export default function setupPowerPointRestRoutes(app, db) {
  // Search powerpoint by title, company, slidecount or creationDate.
  app.get('/api/powerPointSearch/:field/:searchValue', async (req, res) => {
    // Extract field and searchValue from the request parameters.
    const { field, searchValue } = req.params;

    // Collection of valid fields and their corresponding JSON paths.
    const validFields = {
      title: '$.title',
      company: '$.company',
      slides: '$.slideCount',
      date: '$.creationDate',
      size: '$.fileSize'
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
        metaPowerPoint->>'$.fileSize' AS size,
        metaPowerPoint->>'$.slideCount' AS slides,
        metaPowerPoint->>'$.creationDate' AS date
      FROM powerPoint
      WHERE LOWER(metaPowerPoint->>"${validFields[field]}") LIKE LOWER(?)
    `;

    // Execute the query with the search value wrapped in wildcards for partial matching.
    const [result] = await db.execute(query, [`%${searchValue}%`]);
    // Return the search results as a JSON response.
    res.json(result);
  });

};