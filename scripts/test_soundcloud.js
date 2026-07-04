const axios = require('axios');

async function getSoundCloudClientId() {
  try {
    console.log("Fetching SoundCloud homepage...");
    const res = await axios.get('https://soundcloud.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    // Find all script tags in the page
    const scriptUrls = [];
    const scriptRegex = /<script\s+[^>]*src=["'](https:\/\/a-v2\.sndcdn\.com\/assets\/[^"']+\.js)["']/g;
    let match;
    while ((match = scriptRegex.exec(res.data)) !== null) {
      scriptUrls.push(match[1]);
    }
    
    console.log(`Found ${scriptUrls.length} asset scripts.`);
    
    // Scan script contents for client_id
    for (const url of scriptUrls.reverse()) { // client_id is usually in the last few scripts
      console.log(`Checking script: ${url}`);
      const scriptRes = await axios.get(url);
      const clientIdMatch = scriptRes.data.match(/client_id[:=]\s*["']([a-zA-Z0-9]{32})["']/);
      if (clientIdMatch) {
        console.log(`Found SoundCloud Client ID: ${clientIdMatch[1]}`);
        return clientIdMatch[1];
      }
    }
  } catch (err) {
    console.error("Error getting SoundCloud client ID:", err.message);
  }
  return null;
}

async function searchSoundCloud(clientId, query) {
  try {
    const url = `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(query)}&client_id=${clientId}&limit=3`;
    console.log(`Searching SoundCloud: ${url}`);
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    return res.data.collection;
  } catch (err) {
    console.error("Error searching SoundCloud:", err.message);
    return [];
  }
}

async function main() {
  const clientId = await getSoundCloudClientId();
  if (!clientId) {
    console.log("Could not find SoundCloud client ID.");
    return;
  }
  
  const tracks = await searchSoundCloud(clientId, "Don Toliver Tuition");
  console.log(`Found ${tracks.length} tracks.`);
  for (const t of tracks) {
    console.log(`- Title: ${t.title}`);
    console.log(`  Duration: ${t.duration / 1000}s`);
    console.log(`  Artwork: ${t.artwork_url}`);
    console.log(`  Media transcodings:`, t.media?.transcodings?.map(x => ({
      preset: x.preset,
      snipped: x.snipped,
      mime: x.mime_type,
      protocol: x.protocol,
      url: x.url
    })));
    
    // Try to resolve the actual stream URL for the first transcoding (progressive or hls)
    const transcoding = t.media?.transcodings?.find(x => x.format.protocol === 'progressive') 
                     || t.media?.transcodings?.[0];
    if (transcoding) {
      try {
        console.log(`Fetching stream redirection from transcoding URL: ${transcoding.url}`);
        const streamRes = await axios.get(`${transcoding.url}?client_id=${clientId}`);
        console.log(`Resolved stream URL:`, streamRes.data.url);
      } catch (err) {
        console.error("Failed to get stream URL:", err.message);
      }
    }
  }
}

main();
