// En sida för att söka i powerpoint-filer
// Sök på titel, skapare och skapelsedatum
// Visa titel, skapare, skapelsedatum, antal slides och länk för nedladdning
export function powerPointSearchPageContent() {
  return `
      <h1>Search powerpoints</h1>
    <div class="search-controls">
      <label>
        <span class="label-text">Sök på:</span>
        <select name="powerPointSearchField">
          <option value="title">Title</option>
          <option value="creationDate">Creation date</option>
          <option value="company">Creator</option>
        </select>
      </label>
      <label>
        <input name="powerPointSearch" type="text" placeholder="Search among powerpoints">
      </label>
    </div>
    <section class="powerPointSearchResult"></section>
    `;
}

// Keyup i sökfältet (efter varje tangenttryckning) för att söka 
document.body.addEventListener('keyup', event => {
  let inputField = event.target.closest('input[name="powerPointSearch"]');
  if (!inputField) return;
  powerPointSearch();
});

// Ändra i dropdown för att söka på annat fält
// (titel, skapare eller skapelsedatum)
document.body.addEventListener('change', event => {
  let select = event.target.closest('select[name="powerPointSearchField"]');
  if (!select) return;
  powerPointSearch();
});


// Klick på "Show all metadata"-knappen för att visa all metadata för en powerpoint-fil
document.body.addEventListener('click', async event => {
  let button = event.target.closest('.btnShowAllPowerPointMetadata');
  if (!button) return;

  // Ifall metadata redan visas 
  let next = button.nextElementSibling;
  if (next && next.classList.contains('metadata-container')) {
    next.remove();
    button.textContent = 'Show all metadata';
    return;
  }

  // Hämta all metadata för powerpoint-filen och visa den
  let id = button.getAttribute('data-id');
  let rawResponse = await fetch('/api/powerPoint-all-meta/' + id);
  let result = await rawResponse.json();

  // Bygg en tabell av metaPowerPoint-data
  let container = document.createElement('div');
  container.className = 'metadata-container';

  let table = document.createElement('table');
  table.className = 'metaTable';
  let tbody = document.createElement('tbody');

  // Visa alla nycklar i metaPowerPoint
  for (let key in result.metaPowerPoint) {
    let tr = document.createElement('tr');

    let tdKey = document.createElement('td');
    tdKey.textContent = key;

    let tdVal = document.createElement('td');
    let val = result.metaPowerPoint[key];
    tdVal.textContent =
      typeof val === 'object' && val !== null
        ? JSON.stringify(val, null, 2)
        : val;

    tr.appendChild(tdKey);
    tr.appendChild(tdVal);
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  container.appendChild(table);

  button.after(container);
  button.textContent = 'Hide metadata';
});

// Sökfunktion för powerpoint-filer 
async function powerPointSearch() {
  let inputField = document.querySelector('input[name="powerPointSearch"]');
  if (inputField.value === '') {
    document.querySelector('.powerPointSearchResult').innerHTML = '';
    return;
  }

  // Hämta valt fält att söka på
  let field = document.querySelector('select[name="powerPointSearchField"]').value;

  // Hämta sökresultat från backend
  let rawResponse = await fetch(
    `/api/powerPointSearch/${field}/${encodeURIComponent(inputField.value)}`
  );
  let result = await rawResponse.json();

  // Visa sökresultatet
  let resultAsHtml = `<p>${result.length} results</p>`;
  for (let { id, title, company, date, slides } of result) {
    resultAsHtml += `
      <article>
        <h3>${title || 'Unknown title'}</h3><br>
        <h2>${company || 'Unknown creator'}</h2><br>
        <p><b>Created:</b> ${date || 'Unknown date'}</p>
        <p><b>Number of slides:</b> ${slides || 'Unknown number'}</p>
        <p><a href="/api/powerPoint-download/${id}">Download the file</a></p>
        <p><button class="btnShowAllPowerPointMetadata" data-id="${id}">Show all metadata</button></p>
      </article>
    `;
  }


  document.querySelector('.powerPointSearchResult').innerHTML = resultAsHtml;
}
