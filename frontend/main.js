// Javascript för frontend
// Hanterar meny och sidinnehåll
import { startPageContent } from './startPage.js';
import { musicSearchPageContent } from './musicSearch.js';
import { powerPointSearchPageContent } from './powerPointSearch.js';
import { pdfSearchPageContent } from './pdfSearch.js';
import { imageSearchPageContent } from './photoSearch.js';

// Hantera menyval i headern och visa rätt innehåll i main
// Lyssna på klick i hela bodyn
document.body.addEventListener('click', event => {
  let navLink = event.target.closest('header nav a');
  if (!navLink) { return; }
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
  else if (label === 'Search music') {
    content = musicSearchPageContent();
  }
  else if (label === 'Search powerpoints') {
    content = powerPointSearchPageContent();
  }
  else if (label === 'Search PDF') {
    content = pdfSearchPageContent();
  }
  else if (label === 'Search') {
    content = imageSearchPageContent();
  }
  document.querySelector('main').innerHTML = content;
}

// Visa startsidan vid laddning
showContent('Start');