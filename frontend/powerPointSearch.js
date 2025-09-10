// A function to create the power point search page content
export function powerPointSearchPageContent() {
  return `
      <h1>Search powerpoints</h1>
      <label>
        Sök på:
        <select name="powerPointSearchField">
          <option value="title">Titel</option>
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

// keyup in the search input field
document.body.addEventListener('keyup', event => {
  let inputField = event.target.closest('input[name="powerPointSearch"]');
  if (!inputField) return;
  powerPointSearch();
});

// change of the select/dropdown field
document.body.addEventListener('change', event => {
  let select = event.target.closest('select[name="powerPointSearchField"]');
  if (!select) return;
  powerPointSearch();
});

// click on "show all metadata"
document.body.addEventListener('click', async event => {
  let button = event.target.closest('.btnShowAllPowerPointMetadata');
  if (!button) return;

  let id = button.getAttribute('data-id');
  let rawResponse = await fetch('/api/powerPoint-all-meta/' + id);
  let result = await rawResponse.json();

  let pre = document.createElement('pre');
  pre.innerHTML = JSON.stringify(result, null, '  ');
  button.after(pre);
});

// search function
async function powerPointSearch() {
  let inputField = document.querySelector('input[name="powerPointSearch"]');
  if (inputField.value === '') {
    document.querySelector('.powerPointSearchResult').innerHTML = '';
    return;
  }

  let field = document.querySelector('select[name="powerPointSearchField"]').value;

  let rawResponse = await fetch(
    `/api/powerPointSearch/${field}/${encodeURIComponent(inputField.value)}`
  );
  let result = await rawResponse.json();

  let resultAsHtml = '';
  for (let { id, title, creationDate, company, original, fileSize, slideCount, fileName } of result) {
    resultAsHtml += `
      <article>
        <h3>${title || 'Unknown title'}</h3>
        <h2>${company || 'Unknown creator'}</h2>
        <p><b>Source:</b> ${original || 'Unknown source'}</p>
        <p><b>Number of slides:</b> ${slideCount || 'Unknown number'}</p>
        <p><b>Size:</b> ${fileSize || 'Unknown size'}</p>
        <p><b>Created:</b> ${creationDate || 'Unknown date'}</p>
        <p><a href="/frontend/powerPoint/${fileName || ''}" download>Download the file</a></p>
        <p><button class="btnShowAllPowerPointMetadata" data-id="${id}">Show all metadata</button></p>
      </article>
    `;
  }

  document.querySelector('.powerPointSearchResult').innerHTML = resultAsHtml;
}
// console.log('powerPointSearch.js loaded');

