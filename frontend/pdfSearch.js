// En funktion för att skapa pdf search-sidoinnehåll
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

// Lyssna efter key ups i pdf-search inputfältet
document.body.addEventListener('keyup', event => {
  let inputField = event.target.closest('input[name="pdf-search"]');
  if (!inputField) return;
  pdfSearch();
});

// Lyssna efter ändringar i dropdowns och filters
document.body.addEventListener('change', event => {
  if (event.target.matches('select[name="pdf-meta-field"]')) {
    pdfSearch();
  }
  if (event.target.matches('input[name="pdf-minPages"], input[name="pdf-maxPages"], input[name="pdf-fromDate"], input[name="pdf-toDate"]')) {
    pdfSearch();
  }
});

// Eventlyssnare för advanced search-sektionen
document.body.addEventListener('click', event => {
  let button = event.target.closest('.btn-advanced-search');
  if (!button) return;
  let section = document.querySelector('.advanced-search');
  if (!section) return;
  if (button.classList.contains('already-shown')) {
    // Göm advanced search-sektionen
    button.classList.remove('already-shown');
    section.style.display = 'none';
  } else {
    // Visa advanced search-sektion
    button.classList.add('already-shown');
    section.style.display = 'block';
  }
});

// Eventlyssnare för knappen "show all metadata"
document.body.addEventListener('click', async event => {
  let button = event.target.closest('.btn-show-all-pdf-metadata');
  if (!button) { return; }
  // om metadatan redan syns
  if (button.classList.contains('already-shown')) {
    button.classList.remove('already-shown');
    let pre = button.nextElementSibling;
    pre.remove();
    return;
  }
  // Om vi har klickat på metadata-knappen
  let id = button.getAttribute('data-id');
  // Fetch detaljerad metadata
  let rawResponse = await fetch('/api/pdf-all-meta/' + id);
  let result = await rawResponse.json();
  // Skapa ett pre element
  let pre = document.createElement('pre');
  pre.innerHTML = JSON.stringify(result, null, '  ');
  // Lägg till ett pre element efter metadata-knappen
  button.after(pre);
  // Lägg till en klass som visar att metadatan redan syns
  button.classList.add('already-shown');
});

// Pdf-sökning (söker vid key ups i sölfältet och ändringar i dropdown
async function pdfSearch() {
  // Få sökresultat från valt input-fält
  let inputField = document.querySelector('input[name="pdf-search"]');
  let query = inputField.value.trim();

  let fromDate = document.querySelector('input[name="pdf-fromDate"]').value;
  let toDate = document.querySelector('input[name="pdf-toDate"]').value;

  let minPages = document.querySelector('input[name="pdf-minPages"]').value;
  let maxPages = document.querySelector('input[name="pdf-maxPages"]').value;

  let fieldSelect = document.querySelector('select[name="pdf-meta-field"]');
  let field = fieldSelect.value || 'all';

  // Bygg URL:en med query-parametrar
  let url = `/api/pdf-search/${field}/${encodeURIComponent(query)}?from=${fromDate}&to=${toDate}`;
  if (minPages) url += `&minPages=${minPages}`;
  if (maxPages) url += `&maxPages=${maxPages}`;

  // Få resultaten och visa
  let rawResponse = await fetch(url);
  let result = await rawResponse.json();
  
  let resultAsHtml = `<p>${result.length} results</p>`;
  for (let { id, fileName, title, author, creator, year, month, day, modYear, modMonth, modDay, pages }
    of result) {
    let YYMMDD = year && month && day ? `${year}-${month}-${day}` : 'Unknown';
    let modYYMMDD = modYear && modMonth && modDay ? `${modYear}-${modMonth}-${modDay}` : 'Unknown';
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

  document.querySelector('.pdf-search-result').innerHTML = resultAsHtml;
}