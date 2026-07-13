// Fonction serverless Netlify : récupère les identifiants TURN chez Metered.
// La clé secrète n'est JAMAIS dans ce fichier — elle vient d'une variable
// d'environnement Netlify (METERED_SECRET_KEY), donc invisible côté navigateur
// et absente de git.
exports.handler = async () => {
  const key = process.env.METERED_SECRET_KEY;
  const domain = process.env.METERED_DOMAIN || 'zonehostile';
  const cors = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  };
  if (!key) {
    return { statusCode: 200, headers: cors, body: JSON.stringify({ error: 'no-key', iceServers: [] }) };
  }
  try {
    const rep = await fetch(`https://${domain}.metered.live/api/v1/turn/credentials?apiKey=${key}`);
    const ice = await rep.json();
    return { statusCode: 200, headers: cors, body: JSON.stringify({ iceServers: Array.isArray(ice) ? ice : [] }) };
  } catch (e) {
    return { statusCode: 200, headers: cors, body: JSON.stringify({ error: String(e), iceServers: [] }) };
  }
};
