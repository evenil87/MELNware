export function musicSearchPageContent() {
  return `
    <h1>Search Music</h1>
    <label>
      Search:
      <select name="music-meta-field">
        <option value="all">All</option>
        <option value="artist">Artist</option>
        <option value="title">Titel</option>
        <option value="album">Album</option>
        <option value="genre">Genre</option>
      </select>
    </label>
    <label>
      <input name="music-search" type="text" placeholder="Search amongst musicfiles">
    </label>
    <section class="music-search-result"></section>
  `;
}

// Bind events for music search page
export function bindMusicSearchEvents() {
  const inputField = document.querySelector('input[name="music-search"]');
  const selectField = document.querySelector('select[name="music-meta-field"]');

  if (!inputField || !selectField) return;

  inputField.addEventListener('keyup', musicSearch);
  selectField.addEventListener('change', musicSearch);
}

// Perform music search
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

    let html = `<p>${results.length} results</p>`;
    results.forEach(({ id, fileName, title, artist, album, genre, year }) => {
      html += `
        <article>
          <h3>${artist || 'Unknown artist'}</h3>
          <h2>${title || 'Unknown titel'}</h2>
          <p><b>From album:</b> ${album || 'Unknown album'}</p>
          <p><b>release year:</b> ${year || 'Unknown year'}</p>
          <p><b>Genre:</b> ${genre || 'Unknown genre'}</p>
          <audio controls src="/music/${fileName}"></audio>
          <p><a href="/music/${fileName}" download>Download</a></p>
          <p><button class="btn-show-all-music-metadata" data-id="${id}">Show all metadata</button></p>
        </article>
      `;
    });

    resultContainer.innerHTML = html;
  } catch (err) {
    resultContainer.innerHTML = `<p style="color:red">Fel vid sökning: ${err.message}</p>`;
  }
}

// Event handler to show/hide all metadata for a music file
document.body.addEventListener('click', async event => {
  let button = event.target.closest('.btn-show-all-music-metadata');
  if (!button) return;

  // If metadata is already shown → hide it
  if (button.classList.contains('already-shown')) {
    button.classList.remove('already-shown');
    button.textContent = 'Show all metadata'; // reset text
    let pre = button.nextElementSibling;
    if (pre && pre.tagName === 'PRE') {
      pre.remove();
    }
    return;
  }

  // Fetch detailed metadata
  let id = button.getAttribute('data-id');
  try {
    let rawResponse = await fetch('/api/music-all-meta/' + id);
    if (!rawResponse.ok) throw new Error(`HTTP error ${rawResponse.status}`);
    let result = await rawResponse.json();

    // Create a <pre> element
    let pre = document.createElement('pre');
    pre.textContent = JSON.stringify(result, null, 2);

    // Add the newly created <pre> after the button
    button.after(pre);

    // Add a class signaling that the metadata is shown + update button text
    button.classList.add('already-shown');
    button.textContent = 'Hide metadata';
  } catch (err) {
    console.error(err);
    alert('Fel vid hämtning av metadata: ' + err.message);
  }
});
