// frontend/globalSearch.js
export function globalSearchPageContent() {
  return `
    <h1>Global Search</h1>
    <label>
      <input name="global-search" type="text" placeholder="Search everywhere">
    </label>
    <section class="global-search-result"></section>
  `;
}

document.body.addEventListener('keyup', async event => {
  let inputField = event.target.closest('input[name="global-search"]');
  if (!inputField) return;

  if (inputField.value.trim() === '') {
    document.querySelector('.global-search-result').innerHTML = '';
    return;
  }

  let rawResponse = await fetch(`/api/global-search/${encodeURIComponent(inputField.value)}`);
  let result = await rawResponse.json();

  let html = `
    <p>${result.photo} results in Photo</p>
    <p>${result.pdf} results in PDF</p>
    <p>${result.music} results in Music</p>
    <p>${result.powerpoint} results in PowerPoint</p>
  `;

  document.querySelector('.global-search-result').innerHTML = html;
});
