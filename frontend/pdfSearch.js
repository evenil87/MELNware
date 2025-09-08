// A function to create the pdf search page content
export function pdfSearchPageContent() {
  let currentYear = new Date().getFullYear();
  let yearOptions = '';
  for (let y = currentYear; y >= 1900; y--) {
    yearOptions += `<li data-value="${y}">${y}</li>`;
  }
  return `
      <h1>Search PDF</h1>
      <label>
        Search for: <select name="pdf-meta-field">
          <option value="">All</option>
          <option value="title">Title</option>
          <option value="author">Author</option>
        </select>
      </label>
        <input name="pdf-search" type="text" placeholder="Search">
      <div class="filter-dropdown">
        <button class="filter-btn">Filter</button>
        <ul class="filter-menu hidden">
          <li class="filter-item" data-filter="year">Year</li>
          <li class="filter-item" data-filter="pages">Pages</li>
        </ul>

        <ul class="filter-submenu hidden" data-submenu="year">
          ${yearOptions}
        </ul>
        <ul class="filter-submenu hidden" data-submenu="pages">
          <li data-value="short"><5 pages</li>
          <li data-value="medium">5-50 pages</li>
          <li data-value="long">>50 pages</li>
        </ul>
      </div>

      <section class="pdf-search-result"></section>
    `;
}


// Listen to key up events in the pdf-search input field
document.body.addEventListener('keyup', event => {
  let inputField = event.target.closest('input[name="pdf-search"]');
  if (!inputField) { return; }
  pdfSearch();
});

// Listen to changes to the select/dropdown pdf meta field
document.body.addEventListener('change', event => {
  let select = event.target.closest('select[name="pdf-meta-field"]');
  if (!select) { return; }
  pdfSearch();
});

// toggle main filter menu
document.body.addEventListener('click', event => {
  let btn = event.target.closest('.filter-btn');
  if (!btn) return;
  document.querySelector('.filter-menu').classList.toggle('hidden');
});

// open sub menu
document.body.addEventListener('click', event => {
  let item = event.target.closest('.filter-item');
  if (!item) return;

  // close all sub menus first
  document.querySelectorAll('.filter-submenu').forEach(ul => ul.classList.add('hidden'));

  // open the right sub menu
  let submenu = document.querySelector(`.filter-submenu[data-submenu="${item.dataset.filter}"]`);
  if (submenu) submenu.classList.remove('hidden');
});

// click on sub menu
document.body.addEventListener('click', async event => {
  let li = event.target.closest('.filter-submenu li');
  if (!li) return;

  let parentSubmenu = li.closest('.filter-submenu');
  let filterType = parentSubmenu.dataset.submenu;

  if (filterType === 'year') {
    let yearValue = li.dataset.value;
    let rawResponse = await fetch(`/api/pdf-filter/year?start=${yearValue}&end=${yearValue}`);
    let result = await rawResponse.json();
    renderPdfResult(result);
  }

  if (filterType === 'pages') {
    let pageValue = li.dataset.value;
    let rawResponse = await fetch(`/api/pdf-filter/pages?pages=${pageValue}`);
    let result = await rawResponse.json();
    renderPdfResult(result);
  }
});

// event handler to show all metadata for a pdf file on click
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

// pdf search (called on key up in search field and on changes to the select/dropdown)
async function pdfSearch() {
  let inputField = document.querySelector('input[name="pdf-search"]');
  // if empty input field do not search just empty search results
  // if(!inputField.value){
  if (inputField.value === '') {
    document.querySelector('.pdf-search-result').innerHTML = '';
    return;
  }
  // get the chosen field to search f
  let field = document.querySelector('select[name="pdf-meta-field"]').value;
  // ask the rest-api for search results
  let rawResponse = await fetch(
    `/api/pdf-search/${field}/${inputField.value}`
  );
  // unpack search results from json
  let result = await rawResponse.json();

  renderPdfResult(result);
}

// helper for rendering
function renderPdfResult(result) {
  let resultAsHtml = '';
  for (let { id, fileName, title, author, creator, year, month, day, pages } of result) {
    let YYMMDD = year && month && day ? `${year}-${month}-${day}` : 'Unknown';
    resultAsHtml += `
    <article>
      <h2>${title || 'Unknown'}</h2>
      <p><b>Author:</b> ${author || 'Unknown'}</p>
      <p><b>Tool:</b> ${creator || 'Unknown'}</p>
      <p><b>Date:</b> ${YYMMDD}</p>
      <p><b>Pages:</b> ${pages || 'Unknown'}</p>
      <p><a href="/pdf/${fileName}" download>Download</a></p>
      <p><button class="btn-show-all-pdf-metadata" data-id="${id}">Show all metadata</button></p>
      <pre class="pdf-metadata hidden"></pre>
    </article>
  `;
  }
  document.querySelector('.pdf-search-result').innerHTML = resultAsHtml;
}