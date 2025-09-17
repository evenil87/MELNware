import express from 'express';

// pretend this data comes from a database query :)
let mockData = [
  {
    id: 1,
    title: 'SD fortsätter växa',
    meta: {
      original: 'https://www.expressen.se/nyheter/politik/ny-opinionsmatning--sd-fortsatter-vaxa'
    }
  },
  {
    id: 2,
    title: 'Hon vill rädda barnens hjärtan',
    meta: {
      original: 'https://kampanj.expressen.se/hjart-lungfonden/hon-vill-radda-barns-hjartan'
    }
  },
  {
    id: 3,
    title: 'Jorden är platt',
    meta: {
      original: 'https://expressen.se/jorden-aer-platt'
    }
  }

];

// create a server
const app = express();

// a function that check if the orignal links work
async function checkLinks(articles) {
  for (let article of articles) {
    let url = article.meta.original;
    const response = await fetch(url);
    article.workingLink = response.ok;
  }
  return articles;
}

// a rest route that we can image fetches data from the database
// (but right now we are actually using mockData)
app.get('/api/expressen-articles', async (req, res) => {
  res.json(await checkLinks(mockData));
});


app.listen(3040, () => console.log('Listening on http://localhost:3040'));