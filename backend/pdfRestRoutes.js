import path from 'path';
import fs from 'fs';

// Funktion som sätter upp restroutes för pdf-search, metadata och nedladdning
export default function setupPdfRestRoutes(app, db) {
 
  // Route: sök pdf i vår databas
  app.get('/api/pdf-search/:field/:searchValue', async (req, res) => {
    try {
      const { field, searchValue } = req.params;
      const { from, to, minPages, maxPages } = req.query;
      
      // Kolla att 'field' är valid, annars returnera felmeddelande
      if (!['all', 'title', 'author', 'creator', 'date', 'numpages'].includes(field)) {
        return res.status(400).json({ error: 'Invalid field name!' });
      }

      // Hantera datumintervall (till och från)
      // PDF:er lagrar datum som D:YYYYMMDD
      // Vi formaterar CreationDate till ett mer lättläst format
      // STR_TO_DATE används för att kunna filtrera
      let dateFilter = '';
      let params = []; // Används för prepared statements för att undvika SQL-injektion
      if (from && to) {
        dateFilter = ` AND STR_TO_DATE(SUBSTRING(metaPdf->>'$.info.CreationDate', 3, 8), '%Y%m%d')
                       BETWEEN ? AND ?`;
        // Formatera YYYY-MM-DD till YYYYMMDD 
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

      // Sök både titel och författare om field === 'all'
      if (field === 'all') {
        const like = '%' + searchValue + '%'; // Wildcard
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
        return res.json(result); // Returnera resultat som JSON
      }

      // Bygg rätt JSON-path för databasen om vi söker i ett specifikt fält
      const queryPath =
        field === 'numpages'
          ? "metaPdf->>'$.numpages'"
          : field === 'date'
            ? "metaPdf->>'$.info.CreationDate'"
            : `metaPdf->>'$.info.${field.charAt(0).toUpperCase() + field.slice(1)}'`;

      // Kör sökningen mot databasen
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

      res.json(result); // Returnera resultat som JSON
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

  // Route för nedladdning av pdf-fil
  const PDF_DIR = path.resolve('frontend/pdfs');

  // Förhindrar path traversal attacks
  function safeJoinPdf(fileName) {
    const full = path.resolve(PDF_DIR, fileName);
    // Kontrollera att filen ligger inom PDF_DIR
    if (!full.startsWith(PDF_DIR + path.sep)) return null;
    return full;
  }

  app.get('/api/pdf-download/:id', async (req, res) => {
    try {
      const { id } = req.params;

      // Hämta filnamn för angivet id från databasen
      const [rows] = await db.execute(
        `SELECT metaPdf->>'$.file' AS fileName FROM pdf WHERE id = ?`,
        [id]
      );

      const fileName = rows?.[0]?.fileName;
      if (!fileName) return res.status(404).send('Not found');

      // Bygg sökväg och kontrollera att filen finns
      const filePath = safeJoinPdf(fileName);
      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).send('Not found');
      }

      // Sätt headers och skicka filen för nedladdning
      res.setHeader('Content-Type', 'application/pdf');
      res.download(filePath, path.basename(fileName)); // Laddar ner med rätt filnamn
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  });
}