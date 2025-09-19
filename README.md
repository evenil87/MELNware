# MELNware - search 
# Media Search Application

En webbaserad applikation för att söka, visa metadata och ladda ner **bilder, musik, PDFs och PowerPoints**.  
Byggd med **Node.js/Express**, **MySQL** och en enkel **vanilla JavaScript-frontend**.

---

## Funktioner

- **Bildsökning**
  - Sök i filnamn, skapare, datum m.m.
  - Visa miniatyrbilder, metadata och Google Maps-länkar (om koordinater finns).
  - Ladda ner bildfiler.
  - Visa metadata i tabell.

- **Musiksökning**
  - Sök efter titel, artist, album eller genre.
  - Inbyggd musikspelare med waveform-visualisering.
  - Volymkontroll.
  - Visa metadata i tabell och ladda ner musikfiler.

- **PDF-sökning**
  - Sök i titel, författare eller textinnehåll.
  - Filtrera på datumintervall eller sidantal.
  - Sortera på titel eller datum.
  - Visa metadata och ladda ner PDF-filer.

- **PowerPoint-sökning**
  - Sök på titel, skapare, antal slides eller skapelsedatum.
  - Visa metadata.
  - Ladda ner PowerPoint-filer.

- **Global sökning**
  - Sök tvärs över flera filtyper (bilder, musik, pdf, powerpoint).

---

## Teknologier

- **Backend:** [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)  
- **Databas:** [MySQL](https://www.mysql.com/) (`mysql2/promise`)  
- **Frontend:** Vanilla JavaScript, HTML, CSS  
---
**Filstruktur:**
```txt
backend/ → REST API för filer (bilder, musik, pdf, powerpoint, global search)
frontend/ → HTML, CSS, JS för användargränssnittet
├─ music/ → Musikfiler
├─ pdfs/ → PDF-filer
├─ photos/ → Bildfiler
├─ powerpoint/→ PowerPoint-filer
├─ video/ → (framtida stöd för video)
├─ index.html → Startsida
├─ main.js → Navigation och sidinnehåll
└─ style.css → Stilmall
database/ → Databasrelaterade filer(förutom dbImportPowerPoint.js som ligger utanför då den inte kunde hittas när den låg inuti mappen)
---

## Installation

### 1. Klona projektet
```bash
git clone https://github.com/<ditt-användarnamn>/<ditt-repo>.git
cd <ditt-repo>
2. Installera beroenden
bash
Kopiera kod
npm install
3. Konfigurera databasen
Skapa en MySQL-databas och fyll i db-credentials.js med dina uppgifter:

js
Kopiera kod
export default {
  host: 'localhost',
  user: 'root',
  password: 'ditt-lösenord',
  database: 'media'
};
4. Starta servern
bash
Kopiera kod
node index.js
Servern körs nu på http://localhost:3000.

Användning
Starta servern.

Öppna http://localhost:3000 i webbläsaren.

Navigera i menyn:

Photo - Bildsök

Music - Musiksök

PDF - PDF-sök

PowerPoint - PowerPoint-sök

Globalsearch - Sök globalt tvärs över alla filtyper