// skapar en funktion som visar upp söksidan för bilder i frontend
export function imageSearchPageContent() {
  return `
      <h1>Photo Search</h1>
      <label>
        Search for: <select name="image-meta-field">
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

// Lägger till en event listener på hela body som lyssnar efter keyup events
// När en keyup (alltså klickar på en knapp) event sker kollar vi om event.target 
// (det element som triggat eventet) är ett input-fält med name=image-search
// Om det inte är det så returnerar vi och gör inget mer
// Om det är det så kallar vi på funktionen photoSearch som gör själva sökningen och uppdaterar sökresultaten
document.body.addEventListener('keyup', event => {
  let inputField = event.target.closest('input[name="image-search"]');
  if (!inputField) { return; }
  photoSearch();
});

// Lyssnar på alla change-händelser som sker någonstans i body.
// Som är i närheten av en select med name=image-meta-field
document.body.addEventListener('change', event => {
  let select = event.target.closest('select[name="image-meta-field"]');
  if (!select) { return; }
  photoSearch();
});

// Denna lyssnar efter klick på knappar med klassen btn-show-all-image-metadata
document.body.addEventListener('click', async event => {
  let button = event.target.closest('.btn-show-all-image-metadata');
  if (!button) return;

  // om knappen redan har klassen already-shown, ta bort klassen och ta bort metadata-containern
  if (button.classList.contains('already-shown')) {
    button.classList.remove('already-shown');
    let container = button.nextElementSibling;
    if (container) container.remove();
    return;
  }

  // här hämtar vi all metadata för bilden från vår rest-api
  let id = button.getAttribute('data-id');

  // gör en fetch-anrop till vår api för att hämta all metadata för bilden med det specifika id:et
  let rawResponse = await fetch('/api/image-all-meta/' + id);
  let result = await rawResponse.json();

  // skapar en container för att hålla all metadata
  let container = document.createElement('div');
  container.className = 'metadata-container';

  // vi börjar skapa en tabel för att visa all metadata
  let table = document.createElement('table');
  table.className = 'metaTable';
  let tbody = document.createElement('tbody');

  // lägger till en funtion som flattenar objekt
  // så att vi kan visa all metadata i en tabell utan att det ses en klump
  function flatten(obj, prefix = '') {
    if (!obj) return;

    for (let key in obj) {
      if (!Object.hasOwn(obj, key)) continue;

      let value = obj[key];
      let fullKey = prefix ? prefix + '.' + key : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Om objekt - så försök hitta mer infomration rekursivt
        flatten(value, fullKey);
      } else {
        // Annars skapa en tabellrad med nyckel och värde
        let tr = document.createElement('tr');

        let tdKey = document.createElement('td');
        tdKey.textContent = fullKey;

        let tdVal = document.createElement('td');
        tdVal.textContent = Array.isArray(value)
          ? value.join(', ') // Om värdet är en array, slå ihop med kommatecken
          : value; // Annars visa värdet direkt

        // Lägg ihop nyckel och värde i raden
        tr.appendChild(tdKey);
        tr.appendChild(tdVal);
        tbody.appendChild(tr);
      }
    }
  }


  // här lägger vi till metadatan i tabellen, börjar med id
  let trId = document.createElement('tr');
  let tdIdKey = document.createElement('td');
  tdIdKey.textContent = 'id';
  let tdIdVal = document.createElement('td');
  tdIdVal.textContent = result.id;
  trId.appendChild(tdIdKey);
  trId.appendChild(tdIdVal);
  tbody.appendChild(trId);

  // sedan resten av metadatan
  let trFile = document.createElement('tr');
  let tdFileKey = document.createElement('td');
  let tdFileVal = document.createElement('td');
  tdFileVal.textContent = result.file;
  trFile.appendChild(tdFileKey);
  trFile.appendChild(tdFileVal);
  tbody.appendChild(trFile);

  // --- Metadata flattenat ---
  flatten(result.metaPhoto);

  table.appendChild(tbody);
  container.appendChild(table);

  button.after(container);
  button.classList.add('already-shown');
});



// nedan följer själva sökfunktionen som gör sökningen och uppdaterar sökresultaten för bilder
async function photoSearch() {
  // hämta input-fältet, där användaren skriver in sin sökterm
  let inputField = document.querySelector('input[name="image-search"]');

  // om input-fältet är tomt, töm sökresultaten och returnera
  if (inputField.value === '') {
    document.querySelector('.image-search-result').innerHTML = '';
    return;
  }
  // Hämtar värdet från select/dropdown menyn för att veta vilken metadata vi ska söka i
  let field = document.querySelector(
    'select[name="image-meta-field"]'
  ).value;

  // hämtar sökresultaten från vår rest-api
  // vi använder encodeURIComponent för att hantera specialtecken i söksträngen
  let rawResponse = await fetch(
    `/api/image-search/${field}/${encodeURIComponent(inputField.value)}`
  );

  // packar upp sökresultaten från json, och väntar på svar med hjälp av await
  let result = await rawResponse.json();

  // visar antal sökresultat som tillhör sökningen
  let resultAsHtml = `<p>${result.length} results</p>`;

  // loopar igenom alla sökresultat och skapar html för varje resultat
  for (let { id, File, Creator, FileSource, Flash, Date, metadata } of result) {

    // om metadata finns för filerna, plocka ut latitute/longitude
    // används för att skapa en länk till google maps om koordinater finns
    let lat = metadata?.latitude;
    let lon = metadata?.longitude;

    // skapar html för varje sökresultat
    // bilden visas upp, filnamn, skapare, datum, filkälla och flash info
    // samt en länk för att ladda ner bilden och en knapp för att visa all metadata
    // och en class som gör att vi kan visa och dölja all metadata
    resultAsHtml += `
      <article>
       <a ${lat && lon ? `href="https://maps.google.com/?q=${lat},${lon}" target="_blank"` : ''}>
          <img src="/photos/${File}">
        </a>
        <p id="greyish">Please click image to see location on Google Maps (if available)</p>
        <h3>${File || 'Unknown'}</h3>
        <h2>${Creator || 'Unknown'}</h2><br>
        <p><b>Date:</b> ${Date || 'Unknown'}</p>
        <p><b>File source:</b> ${FileSource || 'Unknown'}</p>
        <p><b>Flash:</b> ${Flash || 'Unknown'}</p>
        <p><a href="/photos/${File}" download>Download</a></p>
        <p><button class="btn-show-all-image-metadata" data-id="${id}">
          <span class="show">Show metadata</span>
          <span class="hide">Hide metadata</span>
        </button></p>
      </article>
    `;
  }

  // visar upp resultatet för användaren 
  document.querySelector('.image-search-result').innerHTML = resultAsHtml;
}