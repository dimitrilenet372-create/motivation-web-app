# Perfect Day — Site Web

Site marketing responsive pour l'application **Perfect Day**.

## Structure

```
perfectday-site/
├── index.html    ← page principale
├── style.css     ← tous les styles
├── script.js     ← interactions JS
├── favicon.svg   ← icône onglet
└── README.md
```

## Déployer sur GitHub Pages

1. Crée un nouveau repository sur GitHub (ex: `perfectday-site`)
2. Clone-le localement :
   ```bash
   git clone https://github.com/TON-USERNAME/perfectday-site.git
   ```
3. Copie tous les fichiers dans le dossier cloné
4. Pousse les fichiers :
   ```bash
   git add .
   git commit -m "init: Perfect Day site"
   git push origin main
   ```
5. Dans les **Settings** du repo → **Pages** → Source : `main` / `/ (root)`
6. Ton site sera disponible sur :
   `https://TON-USERNAME.github.io/perfectday-site/`

## Sections

- **Hero** — titre Playfair + soleil animé flottant (tilt au hover)
- **Features** — 4 cartes fonctionnalités
- **How it works** — 3 étapes avec visuals interactifs
- **Categories** — pills cliquables (toggle sélection)
- **Pricing** — Free vs Pro
- **CTA** — appel à l'action final
- **Footer** — liens et copyright

## Personnalisation

Toutes les couleurs sont dans `:root` au début de `style.css` :
- `--orange: #F97316` — couleur principale
- `--yellow: #EAB308` — carré intérieur du soleil
- `--cream: #FEF9E7` — point du soleil
- `--dark: #1C1C1E` — noir des boutons / nav / footer
