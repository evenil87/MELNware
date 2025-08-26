import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse-fork';

let pathToPdfs = './frontend/pdfs';

async function run() {

  let files = fs.readdirSync(pathToPdfs).filter(f => f.toLowerCase().endsWith('.pdf'));

  for (let file of files) {
    let fullPath = path.join(pathToPdfs, file);
    let data = await pdfParse(fs.readFileSync(fullPath));


    console.log('Fil:', file);
    console.log('Antal sidor:', data.numpages);

    console.log('\nInfo');
    console.log(data.info);

    console.log('\nXMP');
    console.log(data.metadata?._metadata);


  }
}

run().catch(console.error);