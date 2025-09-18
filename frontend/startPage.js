export function startPageContent() {
  return `
    <h1>Welcome to MELNware!</h1>
    <p><i>A search engine built by students in Data Managment of TUC Yrkeshögskola.</i></p><br>
    <p>Use the menu above to navigate to the different search pages, where you can search through different files such as Photos, PDF, Music and PowerPoint. All search pages have a dropdown menu where you can select which metadata field to search through, and a text input field where you can type your search query. The search results will be displayed below the input field, and will update automatically as you type or change the selected metadata field.</p>

    <ul>
    <li>On the <b>Search Photo</b>-page you can search through a collection of image files, search through creator and filename. Don't forget to click the images to see where in the world the image is taken!</li>
    <li>On the <b>Search PDF</b>-page you can search through a collection of PDF files, search through title, author and content.</li>
    <li>On the <b>Search Music</b>-page you can search through a collection of music files, search through artist, album, title, genere and year.</li>
    <li>On the <b>Search PowerPoint</b>-page you can search through a collection of PowerPoint files, search through title, author and content.</li>
    </ul><br>

    <p><i>Enjoy your stay!</i></p>
    <p><b>-- The MELNware Team  --</b></p><br>

    <p><i>Note: This is a fictional search engine created for educational purposes. The files and data used in this application are not real and are only meant to demonstrate the functionality of the search engine.</i></p><br>

    <h3>About Us</h3><br>
    <p><i>MELNware is play on words, MELN stands for our students: Malin, Evelina, Linda och Nadia, while the ware comes from datawarehouse - a system used for reporting and data analysis - and since we are styudying data we thought it would be funny.</i></p>
  `;
}