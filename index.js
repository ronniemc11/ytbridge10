const express = require('express');
const axios = require('axios');
const builder = require('xmlbuilder');

const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = 'AIzaSyDTLUeUIMRzIxIeYCy8tFxckv2qiVOGl3M';

app.get('/', (req, res) => {
  res.send('YouTube GData v2 emulator is running.');
});

app.get('/feeds/api/videos', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).send('Missing query');

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(query)}&key=${API_KEY}`;

  try {
    const ytRes = await axios.get(url);
    const feed = builder.create('feed', { encoding: 'UTF-8' })
      .att('xmlns', 'http://www.w3.org/2005/Atom')
      .att('xmlns:media', 'http://search.yahoo.com/mrss/')
      .att('xmlns:yt', 'http://gdata.youtube.com/schemas/2007');

    ytRes.data.items.forEach(item => {
      const entry = feed.ele('entry');
      const id = item.id.videoId;
      const title = item.snippet.title;
      const published = item.snippet.publishedAt;
      const thumb = item.snippet.thumbnails?.default?.url;

      entry.ele('id', `tag:youtube.com,2008:video:${id}`);
      entry.ele('title', title);
      entry.ele('published', published);
      entry.ele('updated', new Date().toISOString());
      entry.ele('link', { rel: 'alternate', type: 'text/html', href: `https://www.youtube.com/watch?v=${id}` });

      const media = entry.ele('media:group');
      media.ele('media:title', title);
      if (thumb) media.ele('media:thumbnail', { url: thumb });
      media.ele('media:content', {
        url: `https://www.youtube.com/v/${id}`,
        type: 'application/x-shockwave-flash',
        medium: 'video'
      });
    });

    res.set('Content-Type', 'application/atom+xml');
    res.send(feed.end({ pretty: true }));
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(500).send('YouTube API fetch failed');
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
