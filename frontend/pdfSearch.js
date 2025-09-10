// A function to create the pdf search page content
export function pdfSearchPageContent() {
  return `
      <h1>Search PDF</h1>
      <label>
      <button id="toggle-filters">Filter</button>
      <section id="filters" style="display:none; margin-top:10px;">
      <input type="checkbox" name="pdf-field" value="all" checked>
        All
      </label>
      <label>
        <input type="checkbox" name="pdf-field" value="title">
        Title
      </label>
      <label>
        <input type="checkbox" name="pdf-field" value="author">
        Author
      </label>
      <label>
        <input type="checkbox" name="pdf-field" value="creator">
        PDF creator
      </label></section>
      <label>
        <input name="pdf-search" type="text" placeholder="Search">
      </label>
      <section class="pdf-search-result"></section>
    `;
}

// Listen to key up events in the pdf-search input field
document.body.addEventListener('keyup', event => {
  let inputField = event.target.closest('input[name="pdf-search"]');
  if (!inputField) return;
  pdfSearch();
});

// Listen to changes to the checkboxes pdf meta field
document.body.addEventListener('change', event => {
  let checkbox = event.target.closest('input[name="pdf-field"]');
  if (!checkbox) { return; }
  pdfSearch();
});

// event handler to show all metadata for a pdf file on click
// on the button btn-show-all-pdf-metadata
document.body.addEventListener('click', async event => {
  let button = event.target.closest('.btn-show-all-pdf-metadata');
  if (!button) { return; }
  // if the metadata is already shown
  if (button.classList.contains('already-shown')) {
    button.classList.remove('already-shown');
    let pre = button.nextElementSibling;
    pre.remove();
    return;
  }
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
  // add a class signaling that the metadata is shown
  button.classList.add('already-shown');
});

document.body.addEventListener('click', event => {
  if (event.target.id === 'toggle-filters') {
    const filters = document.getElementById('filters');
    if (filters) {
      filters.style.display = filters.style.display === 'none' ? 'block' : 'none';
    }
  }
});

// pdf search (called on key up in search field and on changes to the select/dropdown)
async function pdfSearch() {
  let inputField = document.querySelector('input[name="pdf-search"]');
  let query = inputField.value.trim();
  // get the chosen field to search for in the meta data
  // convert a node list of our checkboxes to a real array
  // only keep the checked checkboxes and then read their values
  let fields = [...document.querySelectorAll('input[name^="pdf-field"]')]
    .filter(x => x.checked)
    .map(x => x.value);
  // if empty input field do not search just empty search results
  // or no field checkboes selected
  if (inputField.value === '' || fields.length === 0) {
    document.querySelector('.pdf-search-result').innerHTML = '';
    return;
  }
  // use 'all' if both author and title is selected
  let field;
  if (fields.includes('title') && fields.includes('author') && fields.length === 2) {
    field = 'all';
  } else if (fields.length === 1) {
    field = fields[0];
  } else {
    // För enkelhet: ta första fältet om fler än 1 (förutom title+author)
    field = fields[0];
  }

  // ask the rest-api (correct rest route) for search results
  let rawResponse = await fetch(`/api/pdf-search/${field}/${encodeURIComponent(query)}`);
  
  // unpack search results from json
  let result = await rawResponse.json();
  let resultAsHtml = `<p>${result.length} results</p>`;
  for (let { id, fileName, title, author, creator, year, month, day, modYear, modMonth, modDay, pages } of result) {
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