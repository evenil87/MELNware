// Javascript för frontend
// Hanterar meny och sidinnehåll
import { startPageContent } from './startPage.js';
import { imageSearchPageContent } from './photoSearch.js';
import { pdfSearchPageContent } from './pdfSearch.js';
import { musicSearchPageContent, bindMusicSearchEvents } from './musicSearch.js';
import { powerPointSearchPageContent } from './powerPointSearch.js';
import { globalSearchPageContent } from './globalSearch.js';

// Hantera menyval i headern och visa rätt innehåll i main
// Lyssna på klick i hela bodyn
document.body.addEventListener('click', event => {
  const navLink = event.target.closest('header nav a');
  if (!navLink) return;
  event.preventDefault();
  // Läs texten i länken
  let linkText = navLink.textContent;
  // Visa rätt innehåll i main

  // Ta bort 'current' från alla länkar först
  document.querySelectorAll('header nav a').forEach(a => a.classList.remove('current'));

  // Lägg till 'current' på den klickade länken
  navLink.classList.add('current');

  showContent(linkText);
  // console.log('linkText:', linkText);

});


// Funktion för att visa innehåll i main baserat på menyval
function showContent(label) {
  let content;
  if (label === 'Start') {
    content = startPageContent();
  }
  else if (label === 'Search PDF') {
    content = pdfSearchPageContent();
  }
  else if (label === 'Search Photo') {
    content = imageSearchPageContent();
  }
  else if (label === 'Search Music') {
    content = musicSearchPageContent();
  }
  else if (label === 'Search PowerPoint') {
    content = powerPointSearchPageContent();
  }
  else if (label === 'Global Search') {
    content = globalSearchPageContent();
  }
  document.querySelector('main').innerHTML = content;

  // Delegate event binding to the page module
  if (label === 'Search Music') {
    bindMusicSearchEvents();
  }
}

// Visa startsidan vid laddning
showContent('Start');
// Lägg current på Start vid laddning
document.querySelector('header nav a').classList.add('current');
