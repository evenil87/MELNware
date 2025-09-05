// A function to create the pdf search page content
export function pdfSearchPageContent() {
  return `
      <h1>Search PDF</h1>
      <label>
        <input name="pdf-search" type="text" placeholder="Search">
      </label>
      <button id="toggle-filters">Filter</button>
      <section id="filters" style="display:none; margin-top:10px;">
        <label><input type="checkbox" name="field" value="all" checked> All data</label><br>
        <label><input type="checkbox" name="field" value="title"> Title</label><br>
        <label><input type="checkbox" name="field" value="author"> Author</label><br>
        <label><input type="checkbox" name="field" value="creator"> Creator</label><br>
        <label><input type="checkbox" name="field" value="date"> Date</label><br>
        <label><input type="checkbox" name="field" value="numpages"> Number of pages</label>
      </section>
      <section class="pdf-search-result"></section>
    `;
}


// Listen to key up events in the pdf-search input field
document.body.addEventListener('keyup', event => {
  let inputField = event.target.closest('input[name="pdf-search"]');
  if (!inputField) { return; }
  pdfSearch();
});


// Listen to changes in filters
document.body.addEventListener('change', event => {
  let select = event.target.closest('#filters input[name="field"]');
  if (!select) { return; }
  pdfSearch();
});

// event handler to show all metadata for a pdf file on click
// on the button btn-show-all-pdf-metadata
document.body.addEventListener('click', async event => {
  let button = event.target.closest('.btn-show-all-pdf-metadata');
  if (!button) { return; }
  // if we have clicked a  btn-show-all-pdf-metadata
  let id = button.getAttribute('data-id');
  // fetch detailed metadata
  let rawResponse = await fetch('/api/pdf-all-meta/' + id);
  let result = await rawResponse.json();
  // create a pre element
  let pre = document.createElement('pre');
  pre.innerHTML = JSON.stringify(result, null, '  ');
  // add the newly created pre element after the button
  button.after(pre);
});

// Toggle filter visibility
document.body.addEventListener('click', event => {
  if (event.target.id === 'toggle-filters') {
    const filters = document.getElementById('filters');
    if (filters) {
      filters.style.display = filters.style.display === 'none' ? 'block' : 'none';
    }
  }
});

// pdf search (called on key up in search field and on changes to the filters)
async function pdfSearch() {
  let inputField = document.querySelector('input[name="pdf-search"]');
  if (inputField.value === '') {
    document.querySelector('.pdf-search-result').innerHTML = '';
    return;
  }

  // vilka filter är valda?
  let selectedFields = [...document.querySelectorAll('#filters input[name="field"]:checked')]
    .map(cb => cb.value);

  // fallback: om inget är valt, använd "all"
  let field = 'title';
  if (selectedFields.length > 0 && !selectedFields.includes('all')) {
    field = selectedFields[0]; // ta första markerade
  }

  // ask the rest-api for search results
  let rawResponse = await fetch(
    `/api/pdf-search/${field}/${encodeURIComponent(inputField.value)}`
  );
  // unpack search results from json
  let result = await rawResponse.json();
  let resultAsHtml = '';
  for (let { id, fileName, title, author, creator, date, pages } of result) {
    resultAsHtml += `
    <article>
      <h2>${title || 'Unknown'}</h2>
      <p><b>Author:</b> ${author || 'Unknown'}</p>
      <p><b>Created by:</b> ${creator || 'Unknown'}</p>
      <p><b>Date:</b> ${date || 'Unknown'}</p>
      <p><b>Pages:</b> ${pages || 'Unknown'}</p>
      <p><a href="/pdf/${fileName}" download>Download</a></p>
      <p><button class="btn-show-all-pdf-metadata" data-id="${id}">Show all metadata</button></p>
    </article>
  `;
  }
  // replace content in the .pdf-search-result element (a section tag)
  document.querySelector('.pdf-search-result').innerHTML = resultAsHtml;
}