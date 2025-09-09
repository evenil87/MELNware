// A function to create the pdf search page content
export function pdfSearchPageContent() {
  return `
      <h1>Search PDF</h1>
      <label>
        Search for: <select name="pdf-meta-field">
          <option value="title">Title</option>
          <option value="author">Author</option>
        </select>
      </label>
      <label>
        <input name="pdf-search" type="text" placeholder="Search">
      </label>
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
  let resultAsHtml = '';
  for (let { id, fileName, title, author, creator, year, month, day, pages } of result) {
    let YYMMDD = year && month && day ? `${year}-${month}-${day}` : 'Unknown';
    resultAsHtml += `
    <article>
      <h2>${title || 'Unknown'}</h2>
      <p><b>Author:</b> ${author || 'Unknown'}</p>
      <p><b>Created by:</b> ${creator || 'Unknown'}</p>
      <p><b>Date:</b> ${YYMMDD}</p>
      <p><b>Pages:</b> ${pages || 'Unknown'}</p>
      <p><a href="/pdf/${fileName}" download>Download</a></p>
      <p><button class="btn-show-all-pdf-metadata" data-id="${id}">Show all metadata</button></p>
    </article>
  `;
  }
  // replace content in the .pdf-search-result element (a section tag)
  document.querySelector('.pdf-search-result').innerHTML = resultAsHtml;
}