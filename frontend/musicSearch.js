// Returnerar HTML-innehåll för musik-sök sidan
export function musicSearchPageContent() {
  return `
    <h1>Search Music</h1>
    <label>
      Search:
      <select name="music-meta-field">
        <option value="all">All</option>
        <option value="artist">Artist</option>
        <option value="title">Title</option>
        <option value="album">Album</option>
        <option value="genre">Genre</option>
      </select>
    </label>
    <label>
      <input name="music-search" type="text" placeholder="Search amongst music files">
    </label>
    <section class="music-search-result"></section>

    <style>
      /* Stil för pastel-färgad play-knapp */
      .btn-play.pastel {
        font-size: 1rem;
        padding: 8px 18px;
        border-radius: 9999px;
        border: none;
        background: linear-gradient(135deg, #f9a8d4, #a5f3fc, #c7d2fe);
        background-size: 200% 200%;
        color: #1e293b;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 3px 8px rgba(0,0,0,0.15);
        transition: background-position 0.3s ease, transform 0.2s ease;
        display: inline-block;
        margin: 4px 0; 
      }
      /* Hover-effekt för play-knapp */
      .btn-play.pastel:hover {
        background-position: 100% 0;
        transform: translateY(-2px);
      }
      /* Canvas för ljudvisualisering */
      canvas.waveform {
        display: block;
        width: 100%;
        height: 70px;
        margin-top: 4px;
        border-radius: 8px;
      }
      /* Tidvisning under play-knappen */
      .time-display {
        font-size: 14px;
        color: #333;
        margin-top: 2px;
      }
      /* Avstånd mellan sökresultaten */
      .music-search-result article {
        margin-bottom: 24px;
      }
      /* Stil för metadata-tabell */
      table.metadata-table {
        border-collapse: collapse;
        margin-top: 4px;
        width: 100%;
        max-width: 600px;
      }
      table.metadata-table td {
        border: 1px solid #ccc;
        padding: 6px;
        text-align: left;
      }
      table.metadata-table td.key {
        font-weight: bold;
        background: #f0f0f0;
        width: 35%;
      }
    </style>
  `;
}

// Binder händelser till sökfält och select-fält
export function bindMusicSearchEvents() {
  const inputField = document.querySelector('input[name="music-search"]');
  const selectField = document.querySelector('select[name="music-meta-field"]');

  if (!inputField || !selectField) return;

  // Kör musik-sökning vid tangenttryck eller ändring i select
  inputField.addEventListener('keyup', musicSearch);
  selectField.addEventListener('change', musicSearch);
}

// Utför musik-sökning och renderar resultat
async function musicSearch() {
  const inputField = document.querySelector('input[name="music-search"]');
  const selectField = document.querySelector('select[name="music-meta-field"]');
  const resultContainer = document.querySelector('.music-search-result');

  if (!inputField || !selectField || !resultContainer) return;

  // Töm resultat om sökfältet är tomt
  if (inputField.value.trim() === '') {
    resultContainer.innerHTML = '';
    return;
  }

  const field = selectField.value;
  const searchValue = encodeURIComponent(inputField.value.trim());

  try {
    // Hämta sökresultat från backend-API
    const response = await fetch(`/api/music-search/${field}/${searchValue}`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const results = await response.json();

    let html = `<p>${results.length} results</p>`;
    results.forEach(({ id, fileName, title, artist, album, genre, year }) => {
      html += `
        <article>
          <h3>${artist || 'Unknown artist'}</h3>
          <h2>${title || 'Unknown title'}</h2>
          <p><b>From album:</b> ${album || 'Unknown album'}</p>
          <p><b>Release year:</b> ${year || 'Unknown year'}</p>
          <p><b>Genre:</b> ${genre || 'Unknown genre'}</p>

          <!-- Play-knapp -->
          <button class="btn-play pastel" data-file="/music/${fileName}">Play</button>
          <div class="time-display">00:00 / 00:00</div>
          <canvas class="waveform" data-file="/music/${fileName}"></canvas>

          <!-- Ladda ner-länk -->
          <p style="margin-top:4px;"><a href="/music/${fileName}" download>Download</a></p>
          <!-- Visa all metadata-knapp -->
          <p><button class="btn-show-all-music-metadata" data-id="${id}">Show all metadata</button></p>
        </article>
      `;
    });

    resultContainer.innerHTML = html;
  } catch (err) {
    resultContainer.innerHTML = `<p style="color:red">Fel vid sökning: ${err.message}</p>`;
  }
}

// Rekursiv funktion för att skapa tabellrader för nested metadata
function createTableRows(data, parentKey = '') {
  const rows = [];

  for (const key in data) {
    const value = data[key];
    const fullKey = parentKey ? `${parentKey} → ${key}` : key;

    const tr = document.createElement('tr');

    const tdKey = document.createElement('td');
    tdKey.textContent = fullKey;
    tdKey.classList.add('key');

    const tdValue = document.createElement('td');

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      tdValue.textContent = '[Object]';
      tr.appendChild(tdKey);
      tr.appendChild(tdValue);
      rows.push(tr, ...createTableRows(value, fullKey));
    } else if (Array.isArray(value)) {
      tdValue.textContent = value.join(', ');
      tr.appendChild(tdKey);
      tr.appendChild(tdValue);
      rows.push(tr);
    } else {
      tdValue.textContent = value ?? 'Unknown';
      tr.appendChild(tdKey);
      tr.appendChild(tdValue);
      rows.push(tr);
    }
  }

  return rows;
}

// Visa eller dölj all metadata som tabell (rekursiv)
document.body.addEventListener('click', async event => {
  let button = event.target.closest('.btn-show-all-music-metadata');
  if (!button) return;

  if (button.classList.contains('already-shown')) {
    button.classList.remove('already-shown');
    button.textContent = 'Show all metadata';
    let table = button.nextElementSibling;
    if (table && table.tagName === 'TABLE') table.remove();
    return;
  }

  let id = button.getAttribute('data-id');
  try {
    let rawResponse = await fetch('/api/music-all-meta/' + id);
    if (!rawResponse.ok) throw new Error(`HTTP error ${rawResponse.status}`);
    let result = await rawResponse.json();

    let table = document.createElement('table');
    table.classList.add('metadata-table');

    // Skapa tabellrader rekursivt
    const rows = createTableRows(result);
    rows.forEach(tr => table.appendChild(tr));

    button.after(table);
    button.classList.add('already-shown');
    button.textContent = 'Hide metadata';
  } catch (err) {
    console.error(err);
    alert('Fel vid hämtning av metadata: ' + err.message);
  }
});

// Pastel-färgade ljudvisualiseringar och uppspelning
let audioContext;
let currentSource;
let analyser;
let animationId;

document.body.addEventListener('click', async event => {
  const playButton = event.target.closest('.btn-play');
  if (!playButton) return;

  const canvas = playButton.nextElementSibling.nextElementSibling; // Canvas för visualisering
  const timeDisplay = playButton.nextElementSibling; // Tidvisning
  const file = playButton.getAttribute('data-file');

  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  // Stoppa aktuell uppspelning om det finns någon
  if (currentSource) {
    currentSource.stop();
    cancelAnimationFrame(animationId);
    currentSource = null;
    playButton.textContent = "Play";
    timeDisplay.textContent = "00:00 / 00:00";
    return;
  }

  // Ladda ljudfil
  const response = await fetch(file);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Skapa ljudkälla
  currentSource = audioContext.createBufferSource();
  currentSource.buffer = audioBuffer;

  // Skapa analyser för frekvensdata
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  // Koppla ihop ljudkälla med analyser och destination
  currentSource.connect(analyser);
  analyser.connect(audioContext.destination);

  // Starta uppspelning
  currentSource.start();
  playButton.textContent = "Stop";

  const ctx = canvas.getContext('2d');

  // Formatera sekunder som mm:ss
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // Rita pastel-färgade ljudstaplar
  function drawStacks() {
    animationId = requestAnimationFrame(drawStacks);
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Uppdatera tidvisning
    if (currentSource) {
      const currentTime = audioContext.currentTime - currentSource.startTime;
      const duration = audioBuffer.duration;
      timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
    }

    const barWidth = canvas.width / bufferLength;

    // Rita varje stapel med gradient
    for (let i = 0; i < bufferLength; i++) {
      const value = dataArray[i];
      const percent = value / 255;

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, `rgba(244,114,182,${0.6 + percent*0.4})`);
      gradient.addColorStop(0.5, `rgba(125,211,252,${0.6 + percent*0.4})`);
      gradient.addColorStop(1, `rgba(196,181,253,${0.6 + percent*0.4})`);

      ctx.fillStyle = gradient;
      const barHeight = percent * canvas.height;
      ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth * 0.8, barHeight);
    }
  }

  // Spara uppspelningens starttid
  currentSource.startTime = audioContext.currentTime;

  drawStacks();

  // Återställ när uppspelning är slut
  currentSource.onended = () => {
    playButton.textContent = "Play";
    cancelAnimationFrame(animationId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    timeDisplay.textContent = "00:00 / 00:00";
    currentSource = null;
  };
});
