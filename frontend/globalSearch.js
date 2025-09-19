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

// Lyssna på keyup på input-fältet och gör en sökning
document.body.addEventListener('keyup', async event => {
  let inputField = event.target.closest('input[name="global-search"]');
  if (!inputField) return;

  // Om fältet är tomt, rensa resultatet och returnera
  if (inputField.value.trim() === '') {
    document.querySelector('.global-search-result').innerHTML = '';
    return;
  }
  // Gör en fetch mot vår sökroute och visa resultatet
  let rawResponse = await fetch(`/api/global-search/${encodeURIComponent(inputField.value)}`);
  let result = await rawResponse.json();
  // Bygg upp HTML med resultatet från alla fyra tabeller
  let html = `
    <p>${result.photo} results in Photo</p>
    <p>${result.pdf} results in PDF</p>
    <p>${result.music} results in Music</p>
    <p>${result.powerpoint} results in PowerPoint</p>
  `;

  // Visa resultatet i .global-search-result
  document.querySelector('.global-search-result').innerHTML = html;
});
