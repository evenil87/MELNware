// Funktion som returnerar HTML + CSS för musik-sök sidan
export function musicSearchPageContent() {
  return `
    <h1>Search Music</h1>
    <label>
      Search for:
      <select name="music-meta-field">
        <option value="all">All</option>
        <option value="artist">Artist</option>
        <option value="title">Title</option>
        <option value="album">Album</option>
        <option value="genre">Genre</option>
      </select>
    </label>
    <label>
      <input name="music-search" type="text" placeholder="Search among music files">
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
        border: 1px solid rgba(255,255,255,0.2);
        background: rgba(255,255,255,0.05);
        padding: 6px;
        text-align: left;
      }
      table.metadata-table td.key {
        font-weight: bold;
        background: rgba(240,240,240,0.3);
        width: 35%;
        backdrop-filter: blur(4px);
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

      /* --- Music style för metadata-knappen --- */
      .btn-show-all-music-metadata {
        background-color: #8EB3C9;
        /* standard blå */
        color: #fff;
        border: none;
        padding: 8px 14px;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.3s;
        font-family: 'Roboto', sans-serif;
      }
      .btn-show-all-music-metadata:hover {
        background-color: #759DBC;
      }
      .btn-show-all-music-metadata.already-shown {
        background-color: #57779E;
      }
    </style>
  `;
}

// Binder händelser till sökfält och select-fält
export function bindMusicSearchEvents() {
  let inputField = document.querySelector('input[name="music-search"]');
  let selectField = document.querySelector('select[name="music-meta-field"]');
  if (!inputField || !selectField) return;

  inputField.addEventListener('keyup', musicSearch);
  selectField.addEventListener('change', () => {
    inputField.value = '';   // Rensa söktexten
    musicSearch();
  });
}

// Utför musik-sökning
async function musicSearch() {
  let inputField = document.querySelector('input[name="music-search"]');
  let selectField = document.querySelector('select[name="music-meta-field"]');
  let resultContainer = document.querySelector('.music-search-result');
  if (!inputField || !selectField || !resultContainer) return;

  if (inputField.value.trim() === '') {
    resultContainer.innerHTML = '';
    return;
  }
  // Hämta valt fält och sökord från input fältet
  let field = selectField.value;
  let searchValue = encodeURIComponent(inputField.value.trim());

  try {
    // Hämtar sökresultat från API
    let response = await fetch(`/api/music-search/${field}/${searchValue}`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    let results = await response.json();
    // Bygg upp HTML med sökresultaten och spela upp-knappar etc
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
          <p><button class="btn-show-all-music-metadata" data-id="${id}">Show metadata</button></p>
        </article>
      `;
    });
    // Visa resultatet
    resultContainer.innerHTML = html;
  } catch (err) {
    resultContainer.innerHTML = `<p style="color:red">Fel vid sökning: ${err.message}</p>`;
  }
}

// Rekursiv funktion för musikmetadata-tabell
function buildMusicMetadataRows(obj, tbody, prefix = '') {
  for (let key in obj) {
    let value = obj[key];

    // Hoppa över file
    if (prefix === 'metaMusic' && key === 'file') continue;

    // Om root common eller format, hoppa men gå rekursivt
    if (prefix === 'metaMusic' && (key === 'common' || key === 'format')) {
      if (value && typeof value === 'object') {
        buildMusicMetadataRows(value, tbody, ''); // tom prefix
      }
      continue;
    }

    // Skapa display-nyckel utan metaMusic-prefix
    let displayKey = prefix ? `${prefix} → ${key}` : key;
    if (displayKey.startsWith('metaMusic → ')) {
      displayKey = displayKey.replace('metaMusic → ', '');
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      buildMusicMetadataRows(value, tbody, displayKey);
    } else {
      let tr = document.createElement('tr');

      let tdKey = document.createElement('td');
      tdKey.textContent = displayKey;
      tdKey.classList.add('key');

      let tdVal = document.createElement('td');
      tdVal.textContent = Array.isArray(value) ? value.join(', ') : value ?? 'Okänt';

      tr.appendChild(tdKey);
      tr.appendChild(tdVal);
      tbody.appendChild(tr);
    }
  }
}

// Visa/dölj metadata
document.body.addEventListener('click', async event => {
  let button = event.target.closest('.btn-show-all-music-metadata');
  if (!button) return;

  if (button.classList.contains('already-shown')) {
    button.classList.remove('already-shown');
    let container = button.nextElementSibling;
    if (container) container.remove();
    button.textContent = 'Show metadata';
    return;
  }

  // Hämta metadata från API och visa i tabell
  let id = button.getAttribute('data-id');
  try {
    let rawResponse = await fetch('/api/music-all-meta/' + id);
    if (!rawResponse.ok) throw new Error(`HTTP error ${rawResponse.status}`);
    let result = await rawResponse.json();

    let container = document.createElement('div');
    container.className = 'metadata-container';

    let table = document.createElement('table');
    table.className = 'metadata-table';
    let tbody = document.createElement('tbody');

    // Bygg tabellrader rekursivt
    buildMusicMetadataRows(result, tbody);

    table.appendChild(tbody);
    container.appendChild(table);
    button.after(container);

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

// Lyssna på play-knappar och starta/stoppa uppspelning och animation 
document.body.addEventListener('click', async event => {
  let playButton = event.target.closest('.btn-play');
  if (!playButton) return;

  let canvas = playButton.nextElementSibling.nextElementSibling;
  let timeDisplay = playButton.nextElementSibling;
  let file = playButton.getAttribute('data-file');

  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  // Om redan spelas, stoppa det 
  if (currentSource) {
    currentSource.stop();
    cancelAnimationFrame(animationId);
    currentSource = null;
    playButton.textContent = "Play";
    timeDisplay.textContent = "00:00 / 00:00";
    return;
  }
  // Starta ny uppspelning och animation 
  let response = await fetch(file);
  let arrayBuffer = await response.arrayBuffer();
  let audioBuffer = await audioContext.decodeAudioData(arrayBuffer);


  currentSource = audioContext.createBufferSource();
  currentSource.buffer = audioBuffer;

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  let bufferLength = analyser.frequencyBinCount;
  let dataArray = new Uint8Array(bufferLength);

  gainNode = audioContext.createGain();

  currentSource.connect(analyser);
  analyser.connect(gainNode);
  gainNode.connect(audioContext.destination);

  currentSource.start();
  playButton.textContent = "Stop";
  // Ställ in canvas för visualisering 
  let ctx = canvas.getContext('2d');

  function formatTime(seconds) {
    let m = Math.floor(seconds / 60).toString().padStart(2, '0');
    let s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
  // Animationsloop för att rita staplar i canvas 
  function drawStacks() {
    animationId = requestAnimationFrame(drawStacks);
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentSource) {
      let currentTime = audioContext.currentTime - currentSource.startTime;
      timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(audioBuffer.duration)}`;
    }

    let barWidth = canvas.width / bufferLength;
    // Rita staplar med gradientfärg 
    for (let i = 0; i < bufferLength; i++) {
      let value = dataArray[i];
      let percent = value / 255;

      let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, `rgba(244,114,182,${0.6 + percent * 0.4})`);
      gradient.addColorStop(0.5, `rgba(125,211,252,${0.6 + percent * 0.4})`);
      gradient.addColorStop(1, `rgba(196,181,253,${0.6 + percent * 0.4})`);

      ctx.fillStyle = gradient;
      let barHeight = percent * canvas.height;
      ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth * 0.8, barHeight);
    }
  }

  currentSource.startTime = audioContext.currentTime;

  drawStacks();
  // När ljudet slutar, återställ knappen och stoppa animationen
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
  let volumeSlider = event.target.closest('.neon-volume');
  if (!volumeSlider) return;
  if (gainNode) gainNode.gain.value = parseFloat(volumeSlider.value);

  let percent = parseFloat(volumeSlider.value);
  volumeSlider.style.background = `linear-gradient(90deg, rgba(249,168,212,${0.3 + percent * 0.7}) 0%, rgba(165,243,252,${0.3 + percent * 0.7}) 50%, rgba(199,210,254,${0.3 + percent * 0.7}) 100%)`;
});
