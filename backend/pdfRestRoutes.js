import path from 'path';
import fs from 'fs';

// Funktion som sätter upp restroutes för pdf-search, metadata och nedladdning
export default function setupPdfRestRoutes(app, db) {

  // Route: sök pdf i vår databas
  app.get('/api/pdf-search/:field/:searchValue', async (req, res) => {
    try {
      const { field, searchValue } = req.params;
      const { from, to, minPages, maxPages, sort } = req.query;

      // Kolla att 'field' är valid, annars returnera felmeddelande
      if (!['all', 'title', 'author', 'creator', 'date', 'numpages', 'text'].includes(field)) {
        return res.status(400).json({ error: 'Invalid field name!' });
      }

      // Hantera datumintervall (till och från)
      let dateFilter = '';
      let params = [];
      if (from && to) {
        dateFilter = ` AND STR_TO_DATE(SUBSTRING(metaPdf->>'$.info.CreationDate', 3, 8), '%Y%m%d')
                       BETWEEN ? AND ?`;
        params.push(from.replace(/-/g, ''), to.replace(/-/g, ''));
      }

      // Hantera sidantal (min och max)
      let pagesFilter = '';
      if (minPages) {
        pagesFilter += ' AND CAST(metaPdf->>"$.numpages" AS UNSIGNED) >= ?';
        params.push(minPages);
      }
      if (maxPages) {
        pagesFilter += ' AND CAST(metaPdf->>"$.numpages" AS UNSIGNED) <= ?';
        params.push(maxPages);
      }

      let result;

      // Sök i Title + Author + Text om field === 'all'
      if (field === 'all') {
        const like = '%' + searchValue + '%';
        [result] = await db.execute(
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
                 metaPdf->>'$.numpages'     AS pages,
                 SUBSTRING(metaPdf->>'$.text', 1, 100) AS snippet
          FROM pdf
          WHERE (
             LOWER(metaPdf->>'$.info.Title')  LIKE LOWER(?)
             OR LOWER(metaPdf->>'$.info.Author') LIKE LOWER(?)
             OR LOWER(metaPdf->>'$.text')        LIKE LOWER(?)
          )
          ${dateFilter}
          ${pagesFilter}
        `,
          [like, like, like, ...params]
        );
      } else {
        // Bygg queryPath beroende på vilket fält som valts
        const queryPath =
          field === 'numpages'
            ? "metaPdf->>'$.numpages'"
            : field === 'date'
              ? "metaPdf->>'$.info.CreationDate'"
              : field === 'text'
                ? "metaPdf->>'$.text'"
                : `metaPdf->>'$.info.${field.charAt(0).toUpperCase() + field.slice(1)}'`;

        [result] = await db.execute(
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
                 metaPdf->>'$.numpages'     AS pages,
                 SUBSTRING(metaPdf->>'$.text', 1, 100) AS snippet
          FROM pdf
          WHERE LOWER(${queryPath}) LIKE LOWER(?)
          ${dateFilter}
          ${pagesFilter}
        `,
          ['%' + searchValue + '%', ...params]
        );
      }

      // Sortera i Node.js istället för SQL (för att undvika krasch)
      if (sort === 'title-asc') {
        result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      } else if (sort === 'title-desc') {
        result.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
      } else if (sort === 'date-asc') {
        result.sort((a, b) => {
          let aDate = a.year && a.month && a.day ? new Date(`${a.year}-${a.month}-${a.day}`) : null;
          let bDate = b.year && b.month && b.day ? new Date(`${b.year}-${b.month}-${b.day}`) : null;
          if (!aDate && !bDate) return 0;
          if (!aDate) return 1;
          if (!bDate) return -1;
          return aDate - bDate;
        });
      } else if (sort === 'date-desc') {
        result.sort((a, b) => {
          let aDate = a.year && a.month && a.day ? new Date(`${a.year}-${a.month}-${a.day}`) : null;
          let bDate = b.year && b.month && b.day ? new Date(`${b.year}-${b.month}-${b.day}`) : null;
          if (!aDate && !bDate) return 0;
          if (!aDate) return 1;
          if (!bDate) return -1;
          return bDate - aDate;
        });
      }

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Route som hämtar metadata för specifik PDF
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

  // Route som hämtar första creationDate
  app.get('/api/pdf-min-date', async (req, res) => {
    try {
      const [rows] = await db.execute(`
      SELECT MIN(STR_TO_DATE(SUBSTRING(metaPdf->>'$.info.CreationDate', 3, 8), '%Y%m%d')) AS minDate
      FROM pdf
    `);

      if (rows[0] && rows[0].minDate) {
        const minDate = new Date(rows[0].minDate).toISOString().split("T")[0];
        res.json({ minDate });
      } else {
        res.json({ minDate: "1970-01-01" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Route som hämtar sista creationDate
  app.get('/api/pdf-max-date', async (req, res) => {
    try {
      const [rows] = await db.execute(`
      SELECT MAX(STR_TO_DATE(SUBSTRING(metaPdf->>'$.info.CreationDate', 3, 8), '%Y%m%d')) AS maxDate
      FROM pdf
    `);

      if (rows[0] && rows[0].maxDate) {
        const maxDate = new Date(rows[0].maxDate).toISOString().split("T")[0];
        res.json({ maxDate });
      } else {
        res.json({ maxDate: new Date().toISOString().split("T")[0] });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Route för nedladdning av pdf-fil
  const PDF_DIR = path.resolve('frontend/pdfs');

  function safeJoinPdf(fileName) {
    const full = path.resolve(PDF_DIR, fileName);
    if (!full.startsWith(PDF_DIR + path.sep)) return null;
    return full;
  }

  // Route för nedladdning av pdf-fil
  app.get('/api/pdf-download/:id', async (req, res) => {
    try {
      const { id } = req.params;
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
