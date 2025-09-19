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
  else if (label === 'PDF') {
    content = pdfSearchPageContent();
  }
  else if (label === 'Photo') {
    content = imageSearchPageContent();
  }
  else if (label === 'Music') {
    content = musicSearchPageContent();
  }
  else if (label === 'PowerPoint') {
    content = powerPointSearchPageContent();
  }
  else if (label === 'Global Search') {
    content = globalSearchPageContent();
  }
  document.querySelector('main').innerHTML = content;

  // Delegate event binding to the page module
  if (label === 'Music') {
    bindMusicSearchEvents();
  }
}

// Hämta knappen
const scrollTopBtn = document.getElementById('scrollTopBtn');

// Visa knappen när man scrollar ner
window.addEventListener('scroll', () => {
  if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
    scrollTopBtn.style.display = 'block';
  } else {
    scrollTopBtn.style.display = 'none';
  }
});

// Klicka på pil upp-knappen för att komma till
// toppen av sidan
scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});


// Visa startsidan vid laddning
showContent('Start');
// Lägg current på Start vid laddning
document.querySelector('header nav a').classList.add('current');
