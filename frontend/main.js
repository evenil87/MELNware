import { startPageContent } from './startPage.js';
import { musicSearchPageContent } from './musicSearch.js';

// Handle menu clicks
document.body.addEventListener('click', event => {
  const navLink = event.target.closest('a[data-page]');
  if (!navLink) return;
  event.preventDefault();
  const page = navLink.dataset.page;
  showContent(page);
});

// Show page content
function showContent(page) {
  let content = '';
  if (page === 'start') {
    content = startPageContent();
  } else if (page === 'music-search') {  // must match data-page
    content = musicSearchPageContent();
  }

  document.querySelector('main').innerHTML = content;

  if (page === 'music-search') {
    bindMusicSearchEvents();
  }
}

// Initial page load
showContent('start');

// Bind events for music search page
function bindMusicSearchEvents() {
  const inputField = document.querySelector('input[name="music-search"]');
  const selectField = document.querySelector('select[name="music-meta-field"]');

  if (!inputField || !selectField) return;

  inputField.addEventListener('keyup', musicSearch);
  selectField.addEventListener('change', musicSearch);

  document.body.addEventListener('click', async event => {
    const button = event.target.closest('.btn-show-all-music-metadata');
    if (!button) return;
    const id = button.dataset.id;

    try {
      const rawResponse = await fetch('/api/music-all-meta/' + id);
      if (!rawResponse.ok) throw new Error(`HTTP error ${rawResponse.status}`);
      const result = await rawResponse.json();

      const pre = document.createElement('pre');
      pre.textContent = JSON.stringify(result, null, 2);
      button.after(pre);
    } catch (err) {
      console.error(err);
      alert('Fel vid hämtning av metadata: ' + err.message);
    }
  });
}

// Fetch and display music search results
async function musicSearch() {
  const inputField = document.querySelector('input[name="music-search"]');
  const selectField = document.querySelector('select[name="music-meta-field"]');
  const resultContainer = document.querySelector('.music-search-result');

  if (!inputField || !selectField || !resultContainer) return;
  if (inputField.value.trim() === '') {
    resultContainer.innerHTML = '';
    return;
  }

  const field = selectField.value;
  const searchValue = encodeURIComponent(inputField.value.trim());

  try {
    const response = await fetch(`/api/music-search/${field}/${searchValue}`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const results = await response.json();

    let html = '';
    results.forEach(({ id, fileName, title, artist, album, genre }) => {
      html += `
        <article>
          <h3>${artist || 'Okänd artist'}</h3>
          <h2>${title || 'Okänd titel'}</h2>
          <p><b>Från albumet:</b> ${album || 'Okänt album'}</p>
          <p><b>Genre:</b> ${genre || 'Okänd genre'}</p>
          <audio controls src="/music/${fileName}"></audio>
          <p><a href="/music/${fileName}" download>Ladda ned filen</a></p>
          <p><button class="btn-show-all-music-metadata" data-id="${id}">Visa all metadata</button></p>
        </article>
      `;
    });

    resultContainer.innerHTML = html;
  } catch (err) {
    resultContainer.innerHTML = `<p style="color:red">Fel vid sökning: ${err.message}</p>`;
  }
}
