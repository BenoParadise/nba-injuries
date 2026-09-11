// Récupère le rapport de blessures NBA + les matchs du jour depuis l'API
// publique ESPN, et écrit le résultat dans data.json à la racine du dépôt.
//
// Nécessite Node.js 18+ (fetch global disponible nativement).
// Usage : node scripts/fetch-injuries.js

const fs = require('fs');
const path = require('path');

const INJURIES_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/injuries';
const SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
const OUTPUT_PATH = path.join(__dirname, '..', 'data.json');

async function fetchJSON(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} pour ${url}`);
  return res.json();
}

function extractInjuries(raw) {
  const teams = [];
  const list = (raw && raw.injuries) || [];
  for (const team of list) {
    const teamName = team.displayName || team.name || (team.team && team.team.displayName) || 'Équipe';
    const players = [];
    const entries = team.injuries || [];
    for (const inj of entries) {
      const athlete = inj.athlete || {};
      const status = inj.status || (inj.type && inj.type.description) || 'Inconnu';
      const detailParts = [];
      if (inj.details && inj.details.type) detailParts.push(inj.details.type);
      if (inj.shortComment) detailParts.push(inj.shortComment);
      else if (inj.longComment) detailParts.push(inj.longComment);
      players.push({
        name: athlete.displayName || athlete.fullName || 'Joueur inconnu',
        position: (athlete.position && athlete.position.abbreviation) || '',
        status,
        detail: detailParts.filter(Boolean).join(' — '),
        returnDate: (inj.details && inj.details.returnDate) || ''
      });
    }
    if (players.length) teams.push({ name: teamName, players });
  }
  teams.sort((a, b) => a.name.localeCompare(b.name));
  return teams;
}

function extractTonightGames(raw) {
  const events = (raw && raw.events) || [];
  return events.map((ev) => {
    const comp = ev.competitions && ev.competitions[0];
    const competitors = (comp && comp.competitors) || [];
    const home = competitors.find((c) => c.homeAway === 'home');
    const away = competitors.find((c) => c.homeAway === 'away');
    return {
      date: ev.date,
      status: (ev.status && ev.status.type && ev.status.type.shortDetail) || '',
      home: (home && home.team && (home.team.displayName || home.team.name)) || '',
      away: (away && away.team && (away.team.displayName || away.team.name)) || ''
    };
  });
}

async function main() {
  console.log('Récupération des blessures et du calendrier NBA…');
  const [injRaw, scoreRaw] = await Promise.all([
    fetchJSON(INJURIES_URL),
    fetchJSON(SCOREBOARD_URL)
  ]);

  const teams = extractInjuries(injRaw);
  const games = extractTonightGames(scoreRaw);

  const payload = {
    teams,
    games,
    fetchedAt: Date.now()
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2));
  console.log(`data.json écrit : ${teams.length} équipes, ${games.length} matchs.`);
}

main().catch((err) => {
  console.error('Échec de la récupération :', err);
  process.exit(1);
});
