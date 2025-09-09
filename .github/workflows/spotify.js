// spotify.js
import fs from 'fs';
import axios from 'axios';

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

async function getAccessToken() {
  const resp = await axios.post('https://accounts.spotify.com/api/token', 
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }), 
    {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  return resp.data.access_token;
}

async function getCurrentTrack(accessToken) {
  try {
    const resp = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!resp.data || !resp.data.item) return null;

    const track = resp.data.item;
    const artists = track.artists.map(a => a.name).join(', ');
    return { name: track.name, artists, url: track.external_urls.spotify };
  } catch {
    return null;
  }
}

async function updateReadme() {
  const accessToken = await getAccessToken();
  const track = await getCurrentTrack(accessToken);
  
  const snippet = track 
    ? `[🎧 Now playing: **${track.name}** by ${track.artists}](${track.url})` 
    : `🎧 Not playing anything right now`;

  let readme = fs.readFileSync('README.md', 'utf-8');
  const newReadme = readme.replace(
    /<!-- SPOTIFY_START -->[\s\S]*<!-- SPOTIFY_END -->/,
    `<!-- SPOTIFY_START -->\n${snippet}\n<!-- SPOTIFY_END -->`
  );

  fs.writeFileSync('README.md', newReadme);
}

updateReadme();
