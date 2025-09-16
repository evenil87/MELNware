// A function to create the image search page content
export function imageSearchPageContent() {
  return `
      <h1>Image Search</h1>
      <label>
        Search: <select name="image-meta-field">
          <option value="all">All</option>
          <option value="make">Creator</option>
          <option value="file">Filename</option>
        </select>
      </label>
      <label>
        <input name="image-search" type="text" placeholder="Search among image files">
      </label>
      <section class="image-search-result"></section>
    `;
}

//hej
// Listen to key up events in the image-search input field
document.body.addEventListener('keyup', event => {
  let inputField = event.target.closest('input[name="image-search"]');
  if (!inputField) { return; }
  photoSearch();
});

// Listen to changes to the select/dropdown image meta field
document.body.addEventListener('change', event => {
  let select = event.target.closest('select[name="image-meta-field"]');
  if (!select) { return; }
  photoSearch();
});

// event handler to show all metadata for a image file on click
// on the button btn-show-all-image-metadata
document.body.addEventListener('click', async event => {
  let button = event.target.closest('.btn-show-all-image-metadata');
  if (!button) { return; }
  if (button.classList.contains('already-shown')) {
    button.classList.remove('already-shown');
    let pre = button.nextElementSibling;
    pre.remove();
    return;
  }
  // if we have clicked a  btn-show-all-image-metadata
  let id = button.getAttribute('data-id');
  // fetch detailed metadata
  let rawResponse = await fetch('/api/image-all-meta/' + id);
  let result = await rawResponse.json();
  // create a pre element
  let pre = document.createElement('pre');
  pre.innerHTML = JSON.stringify(result, null, '  ');
  // add the newly created pre element after the button
  button.after(pre);
  button.classList.add('already-shown');
});


// image search (called on key up in search field and on changes to the select/dropdown)
async function photoSearch() {
  let inputField = document.querySelector('input[name="image-search"]');
  // if empty input field do not search just empty search results
  // if(!inputField.value){
  if (inputField.value === '') {
    document.querySelector('.image-search-result').innerHTML = '';
    return;
  }
  // get the chosen field to search for in the meta data
  let field = document.querySelector(
    'select[name="image-meta-field"]'
  ).value;
  // ask the rest-api (correct rest route) for search results
  let rawResponse = await fetch(
    `/api/image-search/${field}/${encodeURIComponent(inputField.value)}`
  );
  // unpack search results from json
  let result = await rawResponse.json();
  // visar antal sökresultat
  let resultAsHtml = `<p>${result.length} results</p>`;
  for (let { id, File, Creator, FileSource, Flash, Date, metadata } of result) {
    // om metadata finns, plocka ut lat/long
    let lat = metadata?.latitude;
    let lon = metadata?.longitude;

    resultAsHtml += `
      <article>
       <a ${lat && lon ? `href="https://maps.google.com/?q=${lat},${lon}" target="_blank"` : ''}>
          <img src="/photos/${File}">
        </a>
        <h3>${File || 'Unknown'}</h3>
        <h2>${Creator || 'Unknown'}</h2>
        <p><b>Date:</b> ${Date || 'Unknown'}</p>
        <p><b>File source:</b> ${FileSource || 'Unknown'}</p>
        <p><b>Flash:</b> ${Flash || 'Unknown'}</p>
        <p><a href="/photos/${File}" download>Download file here</a></p>
        <p><button class="btn-show-all-image-metadata" data-id="${id}">
          <span class="show">Show all metadata</span>
          <span class="hide">Hide all metadata</span>
        </button></p>
      </article>
    `;
  }

  document.querySelector('.image-search-result').innerHTML = resultAsHtml;
}