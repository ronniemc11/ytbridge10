const express = require('express');
const axios = require('axios');
const builder = require('xmlbuilder');

const app = express();
const PORT = 3000;

const API_KEY = 'AIzaSyDTLUeUIMRzIxIeYCy8tFxckv2qiVOGl3M';

app.get('/feeds/api/videos', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).send('Missing query');

  const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(query)}&key=${API_KEY}`;

  try {
    const response = await axios.get(apiUrl);
    const entries = response.data.items.map(item => ({
      title: item.snippet.title,
      videoId: item.id.videoId,
      published: item.snippet.publishedAt,
      link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails.default.url
    }));

    const xml = builder.create('feed', { encoding: 'UTF-8' });
    xml.att('xmlns', 'http://www.w3.org/2005/Atom');

    entries.forEach(entry => {
      const e = xml.ele('entry');
      e.ele('id', entry.videoId);
      e.ele('title', entry.title);
      e.ele('published', entry.published);
      e.ele('link', { rel: 'alternate', type: 'text/html', href: entry.link });
      e.ele('media:group')
        .ele('media:title', entry.title).up()
        .ele('media:thumbnail', { url: entry.thumbnail });
    });

    res.set('Content-Type', 'application/atom+xml');
    res.send(xml.end({ pretty: true }));
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to fetch from YouTube API');
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
