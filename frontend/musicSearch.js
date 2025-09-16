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
      <input name="music-search" type="text" placeholder="Search amongst music files">
    </label>
    <section class="music-search-result"></section>

    <style>
      // Style for pastel play button
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
      // Hover effect for button
      .btn-play.pastel:hover {
        background-position: 100% 0;
        transform: translateY(-2px);
      }
      // Canvas for sound stacks
      canvas.waveform {
        display: block;
        width: 100%;
        height: 70px;
        margin-top: 4px;
        border-radius: 8px;
      }
      // Time display below play button
      .time-display {
        font-size: 14px;
        color: #333;
        margin-top: 2px;
      }
      // Article spacing for search results
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

  // Trigger search on keyup or selection change
  inputField.addEventListener('keyup', musicSearch);
  selectField.addEventListener('change', musicSearch);
}

// Perform the music search and render results
async function musicSearch() {
  const inputField = document.querySelector('input[name="music-search"]');
  const selectField = document.querySelector('select[name="music-meta-field"]');
  const resultContainer = document.querySelector('.music-search-result');

  if (!inputField || !selectField || !resultContainer) return;

  // Clear results if input is empty
  if (inputField.value.trim() === '') {
    resultContainer.innerHTML = '';
    return;
  }

  const field = selectField.value;
  const searchValue = encodeURIComponent(inputField.value.trim());

  try {
    // Fetch search results from backend API
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
          <div class="time-display">00:00 / 00:00</div>
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
    // Hide metadata
    button.classList.remove('already-shown');
    button.textContent = 'Show all metadata';
    let pre = button.nextElementSibling;
    if (pre && pre.tagName === 'PRE') pre.remove();
    return;
  }

  let id = button.getAttribute('data-id');
  try {
    // Fetch full metadata from backend API
    let rawResponse = await fetch('/api/music-all-meta/' + id);
    if (!rawResponse.ok) throw new Error(`HTTP error ${rawResponse.status}`);
    let result = await rawResponse.json();

    // Show metadata in a preformatted block
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

// Pastel sound stack player
let audioContext;
let currentSource;
let analyser;
let animationId;

document.body.addEventListener('click', async event => {
  const playButton = event.target.closest('.btn-play');
  if (!playButton) return;

  const canvas = playButton.nextElementSibling.nextElementSibling; // select canvas
  const timeDisplay = playButton.nextElementSibling; // select time display
  const file = playButton.getAttribute('data-file');

  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  // Stop current playback if any
  if (currentSource) {
    currentSource.stop();
    cancelAnimationFrame(animationId);
    currentSource = null;
    playButton.textContent = "Play";
    timeDisplay.textContent = "00:00 / 00:00";
    return;
  }

  // Load audio from file
  const response = await fetch(file);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Create audio source
  currentSource = audioContext.createBufferSource();
  currentSource.buffer = audioBuffer;

  // Create analyser for frequency data
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  // Connect source to analyser and destination
  currentSource.connect(analyser);
  analyser.connect(audioContext.destination);

  // Start playback
  currentSource.start();
  playButton.textContent = "Stop";

  const ctx = canvas.getContext('2d');

  // Format seconds as mm:ss
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // Draw pastel sound stacks
  function drawStacks() {
    animationId = requestAnimationFrame(drawStacks);
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update time display
    if (currentSource) {
      const currentTime = audioContext.currentTime - currentSource.startTime;
      const duration = audioBuffer.duration;
      timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
    }

    const barWidth = canvas.width / bufferLength;

    // Draw each bar with pastel gradient
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

  // Track playback start time
  currentSource.startTime = audioContext.currentTime;

  drawStacks();

  // Reset when playback ends
  currentSource.onended = () => {
    playButton.textContent = "Play";
    cancelAnimationFrame(animationId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    timeDisplay.textContent = "00:00 / 00:00";
    currentSource = null;
  };
});
