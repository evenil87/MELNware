import path from 'path';
import fs from 'fs';

export default function setupPdfRestRoutes(app, db) {
  // search route
  app.get('/api/pdf-search/:field/:searchValue', async (req, res) => {
    try {
      const { field, searchValue } = req.params;
      const { from, to, minPages, maxPages } = req.query;

      if (!['all', 'title', 'author', 'creator', 'date', 'numpages'].includes(field)) {
        return res.status(400).json({ error: 'Invalid field name!' });
      }

      // CreationDate is currently in D:YYYYMMDD so we transform the dates
      let dateFilter = '';
      let params = [];
      if (from && to) {
        dateFilter = ` AND STR_TO_DATE(SUBSTRING(metaPdf->>'$.info.CreationDate', 3, 8), '%Y%m%d')
                       BETWEEN ? AND ?`;
        params.push(from.replace(/-/g, ''), to.replace(/-/g, ''));
      }

      let pagesFilter = '';
      if (minPages) {
        pagesFilter += ' AND CAST(metaPdf->>"$.numpages" AS UNSIGNED) >= ?';
        params.push(minPages);
      }
      if (maxPages) {
        pagesFilter += ' AND CAST(metaPdf->>"$.numpages" AS UNSIGNED) <= ?';
        params.push(maxPages);
      }

      // search both title and author ('all')
      if (field === 'all') {
        const like = '%' + searchValue + '%';
        const [result] = await db.execute(
          `
          SELECT id,
                 metaPdf->>'$.file' AS fileName,
                 metaPdf->>'$.info.Title'   AS title,
                 metaPdf->>'$.info.Author'  AS author,
                 metaPdf->>'$.info.Creator' AS creator,
                 SUBSTRING(metaPdf->>'$.info.CreationDate', 3, 4) AS year,
                 SUBSTRING(metaPdf->>'$.info.CreationDate', 7, 2) AS month,
                 SUBSTRING(metaPdf->>'$.info.CreationDate', 9, 2) AS day,
                 SUBSTRING(metaPdf->>'$.info.ModDate', 3, 4) AS modYear,
                 SUBSTRING(metaPdf->>'$.info.ModDate', 7, 2) AS modMonth,
                 SUBSTRING(metaPdf->>'$.info.ModDate', 9, 2) AS modDay,
                 metaPdf->>'$.numpages'     AS pages
          FROM pdf
          WHERE (LOWER(metaPdf->>'$.info.Title')  LIKE LOWER(?)
             OR LOWER(metaPdf->>'$.info.Author') LIKE LOWER(?))
             ${dateFilter}
             ${pagesFilter}
        `,
          [like, like, ...params]
        );
        return res.json(result);
      }

      // search pages and dates
      const queryPath =
        field === 'numpages'
          ? "metaPdf->>'$.numpages'"
          : field === 'date'
            ? "metaPdf->>'$.info.CreationDate'"
            : `metaPdf->>'$.info.${field.charAt(0).toUpperCase() + field.slice(1)}'`;

      const [result] = await db.execute(
        `
        SELECT id,
               metaPdf->>'$.file' AS fileName,
               metaPdf->>'$.info.Title'   AS title,
               metaPdf->>'$.info.Author'  AS author,
               metaPdf->>'$.info.Creator' AS creator,
               SUBSTRING(metaPdf->>'$.info.CreationDate', 3, 4) AS year,
               SUBSTRING(metaPdf->>'$.info.CreationDate', 7, 2) AS month,
               SUBSTRING(metaPdf->>'$.info.CreationDate', 9, 2) AS day,
               SUBSTRING(metaPdf->>'$.info.ModDate', 3, 4) AS modYear,
               SUBSTRING(metaPdf->>'$.info.ModDate', 7, 2) AS modMonth,
               SUBSTRING(metaPdf->>'$.info.ModDate', 9, 2) AS modDay,
               metaPdf->>'$.numpages'     AS pages
        FROM pdf
        WHERE LOWER(${queryPath}) LIKE LOWER(?)
        ${dateFilter}
        ${pagesFilter}
      `,
        ['%' + searchValue + '%', ...params]
      );

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // metadata route
  app.get('/api/pdf-all-meta/:id', async (req, res) => {
    try {
      const { id } = req.params;
      let [result] = await db.execute(`SELECT * FROM pdf WHERE id = ?`, [id]);
      res.json(result[0] || {});
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // download file
  const PDF_DIR = path.resolve('frontend/pdfs');

  function safeJoinPdf(fileName) {
    const full = path.resolve(PDF_DIR, fileName);
    if (!full.startsWith(PDF_DIR + path.sep)) return null;
    return full;
  }

  app.get('/api/pdf-download/:id', async (req, res) => {
    try {
      const { id } = req.params;

      // get file name for given id
      const [rows] = await db.execute(
        `SELECT metaPdf->>'$.file' AS fileName FROM pdf WHERE id = ?`,
        [id]
      );

      const fileName = rows?.[0]?.fileName;
      if (!fileName) return res.status(404).send('Not found');

      const filePath = safeJoinPdf(fileName);
      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).send('Not found');
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.download(filePath, path.basename(fileName));
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  });
}