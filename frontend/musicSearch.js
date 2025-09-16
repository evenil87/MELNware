// musicSearch.js

// Return HTML content for music search page
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
      <input name="music-search" type="text" placeholder="Search amongst musicfiles">
    </label>
    <section class="music-search-result"></section>

    <style>
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
        margin: 4px 0; /* space above/below button */
      }
      .btn-play.pastel:hover {
        background-position: 100% 0;
        transform: translateY(-2px);
      }
      canvas.waveform {
        display: block;
        width: 100%;
        height: 70px;
        margin-top: 4px;
        border-radius: 8px;
      }
      .music-search-result article {
        margin-bottom: 24px;
      }
    </style>
  `;
}

// Bind events to search input and meta-field select
export function bindMusicSearchEvents() {
  const inputField = document.querySelector('input[name="music-search"]');
  const selectField = document.querySelector('select[name="music-meta-field"]');

  if (!inputField || !selectField) return;

  inputField.addEventListener('keyup', musicSearch);
  selectField.addEventListener('change', musicSearch);
}

// Perform the music search and render results
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

          <!-- Play button under Genre -->
          <button class="btn-play pastel" data-file="/music/${fileName}">Play</button>
          <canvas class="waveform" data-file="/music/${fileName}"></canvas>

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

// Show or hide all metadata when button is clicked
document.body.addEventListener('click', async event => {
  let button = event.target.closest('.btn-show-all-music-metadata');
  if (!button) return;

  if (button.classList.contains('already-shown')) {
    button.classList.remove('already-shown');
    button.textContent = 'Show all metadata';
    let pre = button.nextElementSibling;
    if (pre && pre.tagName === 'PRE') pre.remove();
    return;
  }

  let id = button.getAttribute('data-id');
  try {
    let rawResponse = await fetch('/api/music-all-meta/' + id);
    if (!rawResponse.ok) throw new Error(`HTTP error ${rawResponse.status}`);
    let result = await rawResponse.json();

    let pre = document.createElement('pre');
    pre.textContent = JSON.stringify(result, null, 2);

    button.after(pre);
    button.classList.add('already-shown');
    button.textContent = 'Hide metadata';
  } catch (err) {
    console.error(err);
    alert('Fel vid hämtning av metadata: ' + err.message);
  }
});

// Rolling waveform player
let audioContext;
let currentSource;
let analyser;
let animationId;

document.body.addEventListener('click', async event => {
  const playButton = event.target.closest('.btn-play');
  if (!playButton) return;

  const canvas = playButton.nextElementSibling;
  const file = playButton.getAttribute('data-file');

  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  // Stop current playback
  if (currentSource) {
    currentSource.stop();
    cancelAnimationFrame(animationId);
    currentSource = null;
    playButton.textContent = "Play";
    return;
  }

  // Load audio
  const response = await fetch(file);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  currentSource = audioContext.createBufferSource();
  currentSource.buffer = audioBuffer;

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 1024;
  const bufferLength = analyser.fftSize;
  const dataArray = new Uint8Array(bufferLength);

  currentSource.connect(analyser);
  analyser.connect(audioContext.destination);

  currentSource.start();
  playButton.textContent = "Stop";

  const ctx = canvas.getContext('2d');

  function draw() {
    animationId = requestAnimationFrame(draw);
    analyser.getByteTimeDomainData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background pastel gradient
    const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGradient.addColorStop(0, "#fdf2f8");
    bgGradient.addColorStop(1, "#f0fdfa");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    function drawWave(color, amp, offset = 0) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;

      const midY = canvas.height / 2;
      const verticalPadding = 0.25; // 25% top/bottom padding
      const effectiveHeight = canvas.height * (1 - verticalPadding * 2);
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      ctx.moveTo(0, midY);

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[(i + offset) % bufferLength] / 128.0 - 1; // -1 to 1
        const y = midY + v * amp * effectiveHeight / 2;

        const nextV = dataArray[(i + 1 + offset) % bufferLength] / 128.0 - 1;
        const nextY = midY + nextV * amp * effectiveHeight / 2;

        const xc = x + sliceWidth / 2;
        const yc = (y + nextY) / 2;

        ctx.quadraticCurveTo(x, y, xc, yc);
        x += sliceWidth;
      }

      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Layered rolling waves
    drawWave("rgba(244,114,182,0.8)", 0.5, 0);
    drawWave("rgba(125,211,252,0.6)", 0.6, 200);
    drawWave("rgba(196,181,253,0.7)", 0.4, 400);
  }

  draw();

  currentSource.onended = () => {
    playButton.textContent = "Play";
    cancelAnimationFrame(animationId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    currentSource = null;
  };
});
