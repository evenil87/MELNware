import { startPageContent } from './startPage.js';
import { musicSearchPageContent, bindMusicSearchEvents } from './musicSearch.js';

// Handle menu clicks
document.body.addEventListener('click', event => {
  const navLink = event.target.closest('a[data-page]');
  if (!navLink) return;
  event.preventDefault();
  const page = navLink.dataset.page;
  showContent(page);
});

// Show page content
function showContent(page) {
  let content = '';
  if (page === 'start') {
    content = startPageContent();
  } else if (page === 'music-search') {
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
