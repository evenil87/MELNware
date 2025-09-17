// Funktion som returnerar pdf-search som HTML
export function pdfSearchPageContent() {
  return `
<h1>Search PDF</h1>
      <label>
        Search for: <select name="pdf-meta-field">
          <option value="">All</option>
          <option value="title">Title</option>
          <option value="author">Author</option>
        </select>
      </label>

      <label>
        <input name="pdf-search" type="text" placeholder="Search">
      </label>

      <p>
        <button class="btn-advanced-search">
          <span class="show">Advanced search</span>
          <span class="hide">Hide advanced search</span>
        </button>
      </p>

      <section class="advanced-search" style="display:none; margin-top:10px;">
        <div class="date-pickers">
          <label>
              From date:
              <input name="pdf-fromDate" type="date" value="1970-01-01">
          </label>
          <label>
              To date:
              <input name="pdf-toDate" type="date" value="${new Date().toISOString().split('T')[0]}">
          </label>
        </div>

        <div class="page-range" style="margin-top:10px;">
          <label>
              Min pages:
              <input name="pdf-minPages" type="number" min="1" value="">
          </label>
          <label>
              Max pages:
              <input name="pdf-maxPages" type="number" min="1" value="">
          </label>
        </div>
      </section>

      <section class="pdf-search-result"></section>
    `;
}

// Lyssna på key ups i pdf-search inputfältet
document.body.addEventListener('keyup', event => {
  let inputField = event.target.closest('input[name="pdf-search"]');
  if (!inputField) return;
  pdfSearch();
});

// Lyssna på ändringar i dropdowns och filters
document.body.addEventListener('change', event => {
  // Ifall användaren byter sökfält (all, title, author)
  if (event.target.matches('select[name="pdf-meta-field"]')) {
    pdfSearch();
  }
  // Ifall användaren ändrar filter (sidantal, datum)
  if (event.target.matches('input[name="pdf-minPages"], input[name="pdf-maxPages"], input[name="pdf-fromDate"], input[name="pdf-toDate"]')) {
    pdfSearch();
  }
});

// Lyssnar på klick på 'Advanced search'-knappen
document.body.addEventListener('click', event => {
  let button = event.target.closest('.btn-advanced-search');
  if (!button) return;
  let section = document.querySelector('.advanced-search');
  if (!section) return;
  // Kolla om advanced search-sektionen redan visas
  if (button.classList.contains('already-shown')) {
    // Dölj advanved search-knappen om sektionen visas
    button.classList.remove('already-shown');
    section.style.display = 'none';
  } else {
    // Visa advanced search-knappen om sektionen är dold
    button.classList.add('already-shown');
    section.style.display = 'block';
  }
});

// Lyssnar på klick på knappen "show all metadata" i sökresultaten
document.body.addEventListener('click', async event => {
  let button = event.target.closest('.btn-show-all-pdf-metadata');
  if (!button) { return; }
  // Dölj knappen om metadatan redan visas
  if (button.classList.contains('already-shown')) {
    button.classList.remove('already-shown');
    let pre = button.nextElementSibling;
    pre.remove();
    return;
  }

  // Hämta detaljerad metadata om vi har klickat på show metadata-knappen
  let id = button.getAttribute('data-id');
  let rawResponse = await fetch('/api/pdf-all-meta/' + id);
  let result = await rawResponse.json();

  // Skapa ett pre element för att visa metadata som JSON
  let pre = document.createElement('pre');
  pre.innerHTML = JSON.stringify(result, null, '  ');

  // Lägg till ett pre element efter metadata-knappen
  button.after(pre);

  // Lägg till en klass som visar att metadatan redan visas
  button.classList.add('already-shown');
});

// Funktion som gör själva sökningen mot API:et
async function pdfSearch() {
  // Läs in värdet från sökfältet
  let inputField = document.querySelector('input[name="pdf-search"]');
  let query = inputField.value.trim();
  // Läs in filtervärden
  let fromDate = document.querySelector('input[name="pdf-fromDate"]').value;
  let toDate = document.querySelector('input[name="pdf-toDate"]').value;

  let minPages = document.querySelector('input[name="pdf-minPages"]').value;
  let maxPages = document.querySelector('input[name="pdf-maxPages"]').value;

  let fieldSelect = document.querySelector('select[name="pdf-meta-field"]');
  let field = fieldSelect.value || 'all';

  // Bygg upp URL:en med query-parametrar
  let url = `/api/pdf-search/${field}/${encodeURIComponent(query)}?from=${fromDate}&to=${toDate}`;
  if (minPages) url += `&minPages=${minPages}`;
  if (maxPages) url += `&maxPages=${maxPages}`;

  // Hämta resultaten från servern
  let rawResponse = await fetch(url);
  let result = await rawResponse.json();
  
  // Bygg HTML för sökresultaten
  let resultAsHtml = `<p>${result.length} results</p>`;
  for (let { id, fileName, title, author, creator, year, month, day, modYear, modMonth, modDay, pages }
    of result) {
    // Formatera datum
    let YYMMDD = year && month && day ? `${year}-${month}-${day}` : 'Unknown';
    let modYYMMDD = modYear && modMonth && modDay ? `${modYear}-${modMonth}-${modDay}` : 'Unknown';
    
    // Lägg till HTML för varje sökträff
    resultAsHtml += `
      <article>
        <h2>${title || 'Unknown'}</h2>
        <p><b>Author:</b> ${author || 'Unknown'}</p>
        <p><b>PDF creator:</b> ${creator || 'Unknown'}</p>
        <p><b>Date:</b> ${YYMMDD}
        <b>Last modified:</b> ${modYYMMDD}</p>
        <p><b>Pages:</b> ${pages || 'Unknown'}</p>
        <p><a href="/api/pdf-download/${id}">Download</a></p>
        <p><button class="btn-show-all-pdf-metadata" data-id="${id}">
            <span class="show">Show more</span>
            <span class="hide">Show less</span>
          </button></p>
      </article>
    `;
  }

  // Visa resultaten på sidan
  document.querySelector('.pdf-search-result').innerHTML = resultAsHtml;
}