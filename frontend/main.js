import { startPageContent } from './startPage.js';
import { imageSearchPageContent } from './photoSearch.js';
import { pdfSearchPageContent } from './pdfSearch.js';
import { musicSearchPageContent, bindMusicSearchEvents } from './musicSearch.js';

// Handle menu clicks
document.body.addEventListener('click', event => {
  const navLink = event.target.closest('a[data-page]');
  if (!navLink) return;
  event.preventDefault();
  // read the text in the link
  let linkText = navLink.textContent;
  // show correct content depending on menu choice
  showContent(linkText);
  console.log('linkText:', linkText);
});

// Show page content
function showContent(page) {
  let content = '';
  if (page === 'start') {
    content = startPageContent();
  }
  else if (label === 'Search music') {
    content = musicSearchPageContent();
  }

  document.querySelector('main').innerHTML = content;

  // Delegate event binding to the page module
  if (page === 'music-search') {
    bindMusicSearchEvents();
  }
}

// Initial page load
showContent('start');
