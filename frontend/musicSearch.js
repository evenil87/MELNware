export function musicSearchPageContent() {
  return `
    <h1>Sök musik</h1>
    <label>
      Sök på:
      <select name="music-meta-field">
        <option value="artist">Artist</option>
        <option value="title">Låttitel</option>
        <option value="album">Album</option>
        <option value="genre">Genre</option>
      </select>
    </label>
    <label>
      <input name="music-search" type="text" placeholder="Sök bland musikfiler">
    </label>
    <section class="music-search-result"></section>
  `;
}
