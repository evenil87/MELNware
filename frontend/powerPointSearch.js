// A simple search page for powerpoints
// with a dropdown to select search field
export function powerPointSearchPageContent() {
  return `
      <h1>Search powerpoints</h1>
      <label>
        Sök på:
        <select name="powerPointSearchField">
          <option value="title">Title</option>
          <option value="creationDate">Creation date</option>
          <option value="company">Creator</option>
        </select>
      </label>
      <label>
        <input name="powerPointSearch" type="text" placeholder="Search among powerpoints">
      </label>
      <section class="powerPointSearchResult"></section>
    `;
}

// Keyup in the input field
document.body.addEventListener('keyup', event => {
  let inputField = event.target.closest('input[name="powerPointSearch"]');
  if (!inputField) return;
  powerPointSearch();
});

// Change in the select field
document.body.addEventListener('change', event => {
  let select = event.target.closest('select[name="powerPointSearchField"]');
  if (!select) return;
  powerPointSearch();
});

// Click on "Show all metadata" button
document.body.addEventListener('click', async event => {
  let button = event.target.closest('.btnShowAllPowerPointMetadata');
  if (!button) return;

  // Check if the <pre> is already shown
  let next = button.nextElementSibling;
  if (next && next.tagName === 'PRE') {
    next.remove();
    button.textContent = 'Show all metadata';
    return;
  }

  // Fetch and show the metadata
  let id = button.getAttribute('data-id');
  let rawResponse = await fetch('/api/powerPoint-all-meta/' + id);
  let result = await rawResponse.json();

  let pre = document.createElement('pre');
  pre.textContent = JSON.stringify(result, null, 2);
  button.after(pre);
  button.textContent = 'Hide metadata';
});

// Search function
async function powerPointSearch() {
  let inputField = document.querySelector('input[name="powerPointSearch"]');
  if (inputField.value === '') {
    document.querySelector('.powerPointSearchResult').innerHTML = '';
    return;
  }

  // Get the selected field
  let field = document.querySelector('select[name="powerPointSearchField"]').value;

  // Fetch the search results
  let rawResponse = await fetch(
    `/api/powerPointSearch/${field}/${encodeURIComponent(inputField.value)}`
  );
  let result = await rawResponse.json();

  // Show the results
  let resultAsHtml = '';
  for (let { id, title, company, date, slides } of result) {
    resultAsHtml += `
      <article>
        <h3>${title || 'Unknown title'}</h3>
        <h2>${company || 'Unknown creator'}</h2>
        <p><b>Created:</b> ${date || 'Unknown date'}</p>
        <p><b>Number of slides:</b> ${slides || 'Unknown number'}</p>
        <p><a href="/api/powerPoint-download/${id}">Download the file</a></p>
        <p><button class="btnShowAllPowerPointMetadata" data-id="${id}">Show all metadata</button></p>
      </article>
    `;
  }

  document.querySelector('.powerPointSearchResult').innerHTML = resultAsHtml;
}
// console.log('powerPointSearch.js loaded');
