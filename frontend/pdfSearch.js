// Funktion som returnerar pdf-search som HTML 
export function pdfSearchPageContent() {
  return `
<h1>Search PDF</h1>
      <label>
        Search for: <select name="pdf-meta-field">
          <option value="">All</option>
          <option value="title">Title</option>
          <option value="author">Author</option>
          <option value="text">Text</option>

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
      <label>
        Sort by:
        <select name="pdf-sort">
          <option value="default">Default</option>
          <option value="title-asc">Title (A–Z)</option>
          <option value="title-desc">Title (Z–A)</option>
          <option value="date-asc">Date (oldest first)</option>
          <option value="date-desc">Date (newest first)</option>
        </select>
      </label>
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
  if (event.target.matches('select[name="pdf-meta-field"]')) {
    pdfSearch();
  }
  if (event.target.matches('input[name="pdf-minPages"], input[name="pdf-maxPages"], input[name="pdf-fromDate"], input[name="pdf-toDate"]')) {
    pdfSearch();
  }
  if (event.target.matches('select[name="pdf-sort"]')) {
    pdfSearch();
  }
});

// Lyssnar på klick på 'Advanced search'-knappen
document.body.addEventListener('click', event => {
  let button = event.target.closest('.btn-advanced-search');
  if (!button) return;
  let section = document.querySelector('.advanced-search');
  if (!section) return;
  if (button.classList.contains('already-shown')) {
    button.classList.remove('already-shown');
    section.style.display = 'none';
  } else {
    button.classList.add('already-shown');
    section.style.display = 'block';
  }
});

// Funktion som bygger metadatans tabellrader
// obj = objektet vi går igenom
// tbody = tabellens <tbody> där vi lägger till rader
// prefix = visar var nyckeln ligger om den ligger djupt i objektet
function buildMetadataTableRows(obj, tbody, prefix = '') {
  // Gå igenom alla nycklar i objektet
  for (let key in obj) {
    let value = obj[key]; // Hämta nyckelns värde
    // Lägg ihop nyckeln med prefix om vi är nere i ett inre objekt
    // t.ex 'metadata._metadata.dc:title'
    let fullKey = prefix ? `${prefix}.${key}` : key;
    // Om värdet är ett objekt och inte null
    if (typeof value === 'object' && value !== null) {
      // Gå djupare ner i objektet, funktionen kallar på sig själv
      buildMetadataTableRows(value, tbody, fullKey);
    } else {
      // Bygg tabellrad om värdet är enkelt
      let tr = document.createElement('tr');

      let tdKey = document.createElement('td');
      tdKey.textContent = fullKey; // Nyckeln t.ex 'pdf:creator'

      let tdVal = document.createElement('td');
      tdVal.textContent = value; // Själva värdet t.ex 'Adobe Acrobat'

      // Lägg ihop nyckeln och värdet i raden
      tr.appendChild(tdKey);
      tr.appendChild(tdVal);
      // Lägg till raden i tabellen
      tbody.appendChild(tr);
    }
  }
}

// Lyssnar på klick på knappen 'show all metadata' i sökresultaten
document.body.addEventListener('click', async event => {
  let button = event.target.closest('.btn-show-all-pdf-metadata');
  if (!button) { return; }

  if (button.classList.contains('already-shown')) {
    button.classList.remove('already-shown');
    let container = button.nextElementSibling;
    container.remove();
    button.textContent = 'Show metadata';
    return;
  }

  let id = button.getAttribute('data-id');
  let rawResponse = await fetch('/api/pdf-all-meta/' + id);
  let result = await rawResponse.json();

  let container = document.createElement('div');
  container.className = 'metadata-container';

  let table = document.createElement('table');
  table.className = 'metaTable';
  let tbody = document.createElement('tbody');

  // Bygg tabellrader för hela metaPdf rekursivt
  buildMetadataTableRows(result.metaPdf, tbody);

  table.appendChild(tbody);
  container.appendChild(table);

  button.after(container);

  button.classList.add('already-shown');
  button.textContent = 'Hide metadata';
});

// Funktion som gör själva sökningen mot API:et
async function pdfSearch() {
  let inputField = document.querySelector('input[name="pdf-search"]');
  let query = inputField.value.trim();

  let fromDate = document.querySelector('input[name="pdf-fromDate"]').value;
  let toDate = document.querySelector('input[name="pdf-toDate"]').value;

  let minPages = document.querySelector('input[name="pdf-minPages"]').value;
  let maxPages = document.querySelector('input[name="pdf-maxPages"]').value;

  let fieldSelect = document.querySelector('select[name="pdf-meta-field"]');
  let field = fieldSelect.value || 'all';

  let sortSelect = document.querySelector('select[name="pdf-sort"]');
  let sort = sortSelect.value || 'default';

  // Lägg till sorteringsval i URL:en
  let url = `/api/pdf-search/${field}/${encodeURIComponent(query)}?from=${fromDate}&to=${toDate}&sort=${sort}`;
  if (minPages) url += `&minPages=${minPages}`;
  if (maxPages) url += `&maxPages=${maxPages}`;

  let rawResponse = await fetch(url);
  let result = await rawResponse.json();

  // Funktion som highlightar sökresultat
  function highlightSnippet(snippet, query) {
    if (!snippet || !query) return snippet;
    try {
      let regex = new RegExp(`(${query})`, 'gi');
      return snippet.replace(regex, '<mark>$1</mark>');
    } catch (e) {
      return snippet;
    }
  }

  let resultAsHtml = `<p>${result.length} results</p>`;
  for (let { id, fileName, title, author, creator, year, month, day, modYear, modMonth, modDay, pages, snippet }
    of result) {
    let YYMMDD = year && month && day ? `${year}-${month}-${day}` : 'Unknown';
    let modYYMMDD = modYear && modMonth && modDay ? `${modYear}-${modMonth}-${modDay}` : 'Unknown';

    let highlightedTitle = title || 'Unknown';
    let highlightedAuthor = author || 'Unknown';
    let highlightedSnippet = snippet;

    // Highlight beroende på vald sökning
    if (field === 'title') {
      highlightedTitle = highlightSnippet(highlightedTitle, query);
    } else if (field === 'author') {
      highlightedAuthor = highlightSnippet(highlightedAuthor, query);
    } else if (field === 'text') {
      highlightedSnippet = highlightSnippet(snippet, query);
    } else if (field === 'all') {
      highlightedTitle = highlightSnippet(highlightedTitle, query);
      highlightedAuthor = highlightSnippet(highlightedAuthor, query);
      highlightedSnippet = highlightSnippet(snippet, query);
    }

    resultAsHtml += `
    <article>
      <h2>${highlightedTitle}</h2>
      <p><b>Author:</b> ${highlightedAuthor}</p>
      <p><b>PDF creator:</b> ${creator || 'Unknown'}</p>
      <p><b>Date:</b> ${YYMMDD}
      <b>Last modified:</b> ${modYYMMDD}</p>
      <p><b>Pages:</b> ${pages || 'Unknown'}</p>
${highlightedSnippet ? `<p class="snippet"><b>Text snippet:</b> ${highlightedSnippet}...</p>` : ''}
      <p><a href="/api/pdf-download/${id}">Download</a></p>      
<p><button class="btn-show-all-pdf-metadata" data-id="${id}">
          <span class="show">Show all metadata</span>
          <span class="hide">Hide metadata</span>
        </button></p>
    </article>
  `;
  }

  document.querySelector('.pdf-search-result').innerHTML = resultAsHtml;
}