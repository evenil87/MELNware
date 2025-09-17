// Javascript för frontend
// Hanterar meny och sidinnehåll
import { startPageContent } from './startPage.js';
import { musicSearchPageContent } from './musicSearch.js';
import { powerPointSearchPageContent } from './powerPointSearch.js';
import { pdfSearchPageContent } from './pdfSearch.js';
import { imageSearchPageContent } from './photoSearch.js';
import { musicSearchPageContent, bindMusicSearchEvents } from './musicSearch.js';
// Hantera menyval i headern och visa rätt innehåll i main
// Lyssna på klick i hela bodyn
document.body.addEventListener('click', event => {
  let navLink = event.target.closest('header nav a');
  if (!navLink) { return; }
  //const navLink = event.target.closest('a[data-page]');
  //if (!navLink) return;
  //const page = navLink.dataset.page;
  //showContent(page);
  event.preventDefault();
  // Läs texten i länken
  let linkText = navLink.textContent;
  // Visa rätt innehåll i main
  showContent(linkText);
  console.log('linkText:', linkText);
});


// Funktion för att visa innehåll i main baserat på menyval
function showContent(label) {
  let content;
  if (label === 'Start') {
    content = startPageContent();
  }
  else if (label === 'Search powerpoints') {
    content = powerPointSearchPageContent();
  }
  else if (label === 'Search PDF') {
    content = pdfSearchPageContent();
  }
  else if (label === 'Search') {
    content = imageSearchPageContent();
  } // JUSTERA PAGE=== TILL LABEL ISTÄLLET byta namn? musicsearch till Search music
  else if (page === 'music-search') {
    content = musicSearchPageContent();
  }
  document.querySelector('main').innerHTML = content;

  // Delegate event binding to the page module
  if (page === 'music-search') {
    bindMusicSearchEvents();
  }
}

// Visa startsidan vid laddning
showContent('Start');