import { startPageContent } from './startPage.js';
// import { musicSearchPageContent } from './music-search.js';
import { imageSearchPageContent } from './photoSearch.js';

// Click on menu link
document.body.addEventListener('click', event => {
  let navLink = event.target.closest('header nav a');
  if (!navLink) { return; }
  // don't try to follow the link in the a tag
  event.preventDefault();
  // read the text in the link
  let linkText = navLink.textContent;
  // show correct content depending on menu choice
  showContent(linkText);
  console.log('linkText:', linkText);
});

// Function to show page content
function showContent(label) {
  let content;
  if (label === 'Start') {
    content = startPageContent();
  }
  else if (label === 'Search') {
    content = imageSearchPageContent();
  }
  document.querySelector('main').innerHTML = content;
}

// When the page loads
showContent('Start');