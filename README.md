# Rapport de blessures NBA — mise à jour automatique

Site statique qui affiche les blessures NBA par équipe et par match du soir,
régénéré toutes les heures par une GitHub Action (aucun serveur à gérer).

## Déploiement (5 minutes)

1. Crée un nouveau dépôt GitHub (public, pour pouvoir utiliser GitHub Pages
   gratuitement) et pousse-y tout le contenu de ce dossier.

   ```bash
   git init
   git add .
   git commit -m "Site initial"
   git branch -M main
   git remote add origin https://github.com/<ton-pseudo>/nba-injuries.git
   git push -u origin main
   ```

2. Sur GitHub : **Settings → Actions → General → Workflow permissions**,
   sélectionne *"Read and write permissions"* et enregistre. (Nécessaire
   pour que l'Action puisse committer `data.json` automatiquement.)

3. Onglet **Actions** du dépôt → sélectionne le workflow
   *"Actualiser les blessures NBA"* → **Run workflow** pour le lancer une
   première fois manuellement. Cela crée `data.json` à la racine.

4. **Settings → Pages** → Source : *Deploy from a branch* → branche `main`,
   dossier `/ (root)` → Save. Le site est alors disponible à
   `https://<ton-pseudo>.github.io/nba-injuries/`.

5. C'est terminé : le workflow tourne désormais tout seul chaque heure
   (`cron: '0 * * * *'`), commit le `data.json` mis à jour, et GitHub Pages
   republie automatiquement le site à chaque commit.

## Fichiers

- `index.html` — le site (lit `data.json`, ou appelle l'API ESPN en direct
  si ce fichier n'existe pas encore).
- `scripts/fetch-injuries.js` — script Node qui interroge l'API publique
  ESPN et écrit `data.json`.
- `.github/workflows/update.yml` — planifie l'exécution du script toutes
  les heures et publie le résultat.

## Tester en local

```bash
node scripts/fetch-injuries.js   # nécessite Node.js 18+
python3 -m http.server 8000      # ou tout autre petit serveur statique
```

Puis ouvre `http://localhost:8000`.

## Notes

- L'heure du cron GitHub Actions est en UTC. `'0 * * * *'` déclenche
  l'exécution à chaque heure pile en UTC — ajuste si tu veux caler
  l'actualisation sur un fuseau précis.
- L'API ESPN est publique mais non officielle : elle peut changer sans
  préavis. Si `fetch-injuries.js` échoue, l'Action affichera l'erreur dans
  l'onglet **Actions** sans casser le site (l'ancien `data.json` reste en
  place jusqu'à la prochaine exécution réussie).
