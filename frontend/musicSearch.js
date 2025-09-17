// Funktion som returnerar HTML + CSS för musik-sök sidan
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
      /* --- Play-knapp --- */
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

      /* Tidvisning */
      .time-display {
        font-size: 14px;
        color: #333;
        margin-top: 2px;
      }

      /* Avstånd mellan sökresultaten */
      .music-search-result article {
        margin-bottom: 24px;
      }

      /* Metadata-tabell */
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

      /* Neon-pastell volymkontroll */
      .neon-volume {
        width: 150px;
        height: 10px;
        border-radius: 5px;
        -webkit-appearance: none;
        appearance: none;
        cursor: pointer;
        background: linear-gradient(90deg, #f9a8d4 0%, #a5f3fc 50%, #c7d2fe 100%);
        transition: background 0.2s ease;
        margin-top: 4px;
      }
      .neon-volume::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #fff;
        border: 2px solid #1e293b;
        cursor: pointer;
        box-shadow: 0 0 8px rgba(255,255,255,0.6);
        transition: box-shadow 0.2s ease, transform 0.2s ease;
      }
      .neon-volume::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 0 12px rgba(255,255,255,0.9);
      }
      .neon-volume::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #fff;
        border: 2px solid #1e293b;
        cursor: pointer;
        box-shadow: 0 0 8px rgba(255,255,255,0.6);
        transition: box-shadow 0.2s ease, transform 0.2s ease;
      }

      .music-player {
        display: flex;
        flex-direction: column;
        gap: 4px;
        align-items: flex-start;
      }
    </style>
  `;
}

// Binder händelser till sökfält och select-fält
export function bindMusicSearchEvents() {
  const inputField = document.querySelector('input[name="music-search"]');
  const selectField = document.querySelector('select[name="music-meta-field"]');
  if (!inputField || !selectField) return;

  inputField.addEventListener('keyup', musicSearch);
  selectField.addEventListener('change', musicSearch);
}

// Utför musik-sökning
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
          <h2>${title || 'Unknown title'}</h2>
          <p><b>From album:</b> ${album || 'Unknown album'}</p>
          <p><b>Release year:</b> ${year || 'Unknown year'}</p>
          <p><b>Genre:</b> ${genre || 'Unknown genre'}</p>

          <!-- Play-knapp -->
          <button class="btn-play pastel" data-file="/music/${fileName}">Play</button>
          <div class="time-display">00:00 / 00:00</div>
          <canvas class="waveform" data-file="/music/${fileName}"></canvas>

          <!-- Neon-volymkontroll -->
          <label>
            Volume:
            <input type="range" min="0" max="1" step="0.01" value="1" class="neon-volume" data-file="/music/${fileName}">
          </label>

          <p style="margin-top:4px;"><a href="/music/${fileName}" download>Download</a></p>
          <p><button class="btn-show-all-music-metadata" data-id="${id}">Show all metadata</button></p>
        </article>
      `;
    });

    resultContainer.innerHTML = html;
  } catch (err) {
    resultContainer.innerHTML = `<p style="color:red">Fel vid sökning: ${err.message}</p>`;
  }
}

// Rekursiv funktion för metadata-tabell
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

// Visa/dölj metadata
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

// --- Musikspelare med waveform och neon-volym ---
let audioContext;
let currentSource;
let analyser;
let gainNode;
let animationId;

document.body.addEventListener('click', async event => {
  const playButton = event.target.closest('.btn-play');
  if (!playButton) return;

  const canvas = playButton.nextElementSibling.nextElementSibling;
  const timeDisplay = playButton.nextElementSibling;
  const file = playButton.getAttribute('data-file');

  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();

  if (currentSource) {
    currentSource.stop();
    cancelAnimationFrame(animationId);
    currentSource = null;
    playButton.textContent = "Play";
    timeDisplay.textContent = "00:00 / 00:00";
    return;
  }

  const response = await fetch(file);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  currentSource = audioContext.createBufferSource();
  currentSource.buffer = audioBuffer;

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  gainNode = audioContext.createGain();

  currentSource.connect(analyser);
  analyser.connect(gainNode);
  gainNode.connect(audioContext.destination);

  currentSource.start();
  playButton.textContent = "Stop";

  const ctx = canvas.getContext('2d');

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function drawStacks() {
    animationId = requestAnimationFrame(drawStacks);
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentSource) {
      const currentTime = audioContext.currentTime - currentSource.startTime;
      timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(audioBuffer.duration)}`;
    }

    const barWidth = canvas.width / bufferLength;

    for (let i = 0; i < bufferLength; i++) {
      const value = dataArray[i];
      const percent = value / 255;

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, `rgba(244,114,182,${0.6 + percent * 0.4})`);
      gradient.addColorStop(0.5, `rgba(125,211,252,${0.6 + percent * 0.4})`);
      gradient.addColorStop(1, `rgba(196,181,253,${0.6 + percent * 0.4})`);

      ctx.fillStyle = gradient;
      const barHeight = percent * canvas.height;
      ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth * 0.8, barHeight);
    }
  }

  currentSource.startTime = audioContext.currentTime;

  drawStacks();

  currentSource.onended = () => {
    playButton.textContent = "Play";
    cancelAnimationFrame(animationId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    timeDisplay.textContent = "00:00 / 00:00";
    currentSource = null;
  };
});

// Neon-volym slider
document.body.addEventListener('input', event => {
  const volumeSlider = event.target.closest('.neon-volume');
  if (!volumeSlider) return;
  if (gainNode) gainNode.gain.value = parseFloat(volumeSlider.value);

  // Intensifiera gradient baserat på volym
  const percent = parseFloat(volumeSlider.value);
  volumeSlider.style.background = `linear-gradient(90deg, rgba(249,168,212,${0.3 + percent * 0.7}) 0%, rgba(165,243,252,${0.3 + percent * 0.7}) 50%, rgba(199,210,254,${0.3 + percent * 0.7}) 100%)`;
});
