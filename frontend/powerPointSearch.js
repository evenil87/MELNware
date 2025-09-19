// --- PowerPoint Search Page Content ---
export function powerPointSearchPageContent() {
  return `
    <h1>Search PowerPoint</h1>

    <div class="search-controls">
      <label>
        <span class="label-text">Search for:</span>
        <select name="powerPointSearchField">
          <option value="all" selected>All</option>
          <option value="title">Title</option>
          <option value="creationDate">Creation date</option>
          <option value="company">Creator</option>
        </select>
      </label>
      <label>
        <input name="powerPointSearch" type="text" placeholder="Search among PowerPoint files">
      </label>
      <button id="btnAdvancedSearch">Advanced search</button>
    </div>

    <section id="advancedSearchFields" style="display:none; margin-top:10px;">
      <div class="adv-row">
        <label>From date: <input type="date" name="pp-fromDate" value="1994-01-01"></label>
        <label>To date: <input type="date" name="pp-toDate" value="${new Date().toISOString().split('T')[0]}"></label>
      </div>
      <div class="adv-row">
        <label>Min slides: <input type="number" name="pp-minSlides" min="1" value=""></label>
        <label>Max slides: <input type="number" name="pp-maxSlides" min="1" value=""></label>
      </div>
    </section>

    <section class="powerPointSearchResult"></section>
  `;
}

// --- Helper Functions ---
function displayValue(val) {
  if (!val) return 'Unknown';
  if (val.trim && val.trim() === '-') return 'Unknown';
  return val;
}

function displayDate(val) {
  if (!val) return 'Unknown';
  if (val.trim && (val.trim() === '-' || val.trim() === '')) return 'Unknown';
  return val.split(' ')[0]; // yyyy-mm-dd
}

// --- Event Listeners ---

// Keyup i sökfältet
document.body.addEventListener('keyup', event => {
  let inputField = event.target.closest('input[name="powerPointSearch"]');
  if (!inputField) return;
  powerPointSearch();
});

// Ändring av fält
document.body.addEventListener('change', event => {
  if (event.target.closest('select[name="powerPointSearchField"]')) {
    powerPointSearch();
  }
  if (event.target.closest('#advancedSearchFields')) {
    powerPointSearch();
  }
});

document.body.addEventListener('click', event => {
  let button = event.target.closest('#btnAdvancedSearch');
  if (!button) return;

  let section = document.querySelector('#advancedSearchFields');
  if (!section) return;

  if (button.classList.contains('already-shown')) {
    // 🔄 Stänger avancerad sökning
    button.classList.remove('already-shown');
    section.style.display = 'none';

    // 🧹 Rensa alla fält när vi stänger
    document.querySelector('input[name="pp-fromDate"]').value = '1994-01-01'; // default
    document.querySelector('input[name="pp-toDate"]').value = new Date().toISOString().split('T')[0];
    document.querySelector('input[name="pp-minSlides"]').value = '';
    document.querySelector('input[name="pp-maxSlides"]').value = '';

    // 🔄 Uppdatera sökningen direkt efter reset
    powerPointSearch();
  } else {
    // 🔄 Öppnar avancerad sökning
    button.classList.add('already-shown');
    section.style.display = 'block';
  }
});



// Visa metadata
document.body.addEventListener('click', async event => {
  let button = event.target.closest('.btnShowAllPowerPointMetadata');
  if (!button) return;

  let next = button.nextElementSibling;
  if (next && next.classList.contains('metadata-container')) {
    next.remove();
    button.textContent = 'Show metadata';
    return;
  }

  let id = button.getAttribute('data-id');
  let rawResponse = await fetch('/api/powerPoint-all-meta/' + id);
  let result = await rawResponse.json();

  let container = document.createElement('div');
  container.className = 'metadata-container';

  let table = document.createElement('table');
  table.className = 'metaTable';
  let tbody = document.createElement('tbody');

  for (let key in result.metaPowerPoint) {
    let tr = document.createElement('tr');

    let tdKey = document.createElement('td');
    tdKey.textContent = key;

    let tdVal = document.createElement('td');
    let val = result.metaPowerPoint[key];
    tdVal.textContent =
      typeof val === 'object' && val !== null ? JSON.stringify(val, null, 2) : val;

    tr.appendChild(tdKey);
    tr.appendChild(tdVal);
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  container.appendChild(table);
  button.after(container);
  button.textContent = 'Hide metadata';
});

// --- PowerPoint Search Function ---
async function powerPointSearch() {
  let inputField = document.querySelector('input[name="powerPointSearch"]');
  let query = inputField.value.trim();
  if (!query) {
    document.querySelector('.powerPointSearchResult').innerHTML = '';
    return;
  }

  let field = document.querySelector('select[name="powerPointSearchField"]').value;

  // Avancerade filter
  let fromDate = document.querySelector('input[name="pp-fromDate"]').value;
  let toDate = document.querySelector('input[name="pp-toDate"]').value;
  let minSlides = document.querySelector('input[name="pp-minSlides"]').value;
  let maxSlides = document.querySelector('input[name="pp-maxSlides"]').value;

  let url = `/api/powerPointSearch/${field}/${encodeURIComponent(query)}?`;
  if (fromDate) url += `from=${fromDate}&`;
  if (toDate) url += `to=${toDate}&`;
  if (minSlides) url += `minSlides=${minSlides}&`;
  if (maxSlides) url += `maxSlides=${maxSlides}&`;

  let rawResponse = await fetch(url);
  let result = await rawResponse.json();

  let resultAsHtml = `<p>${result.length} results</p>`;
  for (let { id, title, company, date, slides } of result) {
    resultAsHtml += `
      <article>
        <h2>${displayValue(title)}</h2><br>
        <p><b>Creator:</b> ${displayValue(company)}</p>
        <p><b>Created:</b> ${displayDate(date)}</p>
        <p><b>Number of slides:</b> ${displayValue(slides)}</p>
        <p><a href="/api/powerPoint-download/${id}">Download</a></p>
        <p><button class="btnShowAllPowerPointMetadata" data-id="${id}">Show metadata</button></p>
      </article>
    `;
  }

  document.querySelector('.powerPointSearchResult').innerHTML = resultAsHtml;
}
