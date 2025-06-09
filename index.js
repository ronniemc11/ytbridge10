const express = require('express');
const axios = require('axios');
const builder = require('xmlbuilder');

const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = 'AIzaSyDTLUeUIMRzIxIeYCy8tFxckv2qiVOGl3M';

app.get('/', (req, res) => {
  res.send('YouTube GData v2 emulator is running.');
});

// Search endpoint
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

    const xml = builder.create('feed', { encoding: 'UTF-8' })
      .att('xmlns', 'http://www.w3.org/2005/Atom')
      .att('xmlns:media', 'http://search.yahoo.com/mrss/')
      .att('xmlns:yt', 'http://gdata.youtube.com/schemas/2007');

    entries.forEach(entry => {
      const e = xml.ele('entry');
      e.ele('id', `tag:youtube.com,2008:video:${entry.videoId}`);
      e.ele('title', entry.title);
      e.ele('published', entry.published);
      e.ele('updated', new Date().toISOString());
      e.ele('link', { rel: 'alternate', type: 'text/html', href: entry.link });

      const mediaGroup = e.ele('media:group');
      mediaGroup.ele('media:title', entry.title);
      mediaGroup.ele('media:thumbnail', { url: entry.thumbnail });
      mediaGroup.ele('media:content', {
        url: `http://www.youtube.com/v/${entry.videoId}`,
        type: 'application/x-shockwave-flash',
        medium: 'video'
      });
    });

    res.set('Content-Type', 'application/atom+xml');
    res.send(xml.end({ pretty: true }));
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to fetch from YouTube API');
  }
});

// Video info endpoint
app.get('/feeds/api/videos/:id', (req, res) => {
  const id = req.params.id;

  const xml = `<?xml version="1.0" ?>
<entry xmlns="http://www.w3.org/2005/Atom"
       xmlns:media="http://search.yahoo.com/mrss/"
       xmlns:yt="http://gdata.youtube.com/schemas/2007">
  <id>tag:youtube.com,2008:video:${id}</id>
  <published>2009-10-25T07:00:00.000Z</published>
  <updated>${new Date().toISOString()}</updated>
  <title>Example Video</title>
  <content type="text">This is a test video served by your server.</content>
  <author><name>TestChannel</name></author>
  <media:group>
    <media:title>Example Video</media:title>
    <media:description>This is a test video served by your server.</media:description>
    <media:player url="http://www.youtube.com/watch?v=${id}"/>
    <media:content url="http://www.youtube.com/v/${id}" type="application/x-shockwave-flash" medium="video"/>
  </media:group>
  <yt:statistics viewCount="999999"/>
</entry>`;

  res.type('application/atom+xml');
  res.send(xml);
});

// User uploads
app.get('/feeds/api/users/:user/uploads', (req, res) => {
  const user = req.params.user;
  const xml = builder.create('feed', { encoding: 'UTF-8' })
    .att('xmlns', 'http://www.w3.org/2005/Atom')
    .att('xmlns:media', 'http://search.yahoo.com/mrss/')
    .att('xmlns:yt', 'http://gdata.youtube.com/schemas/2007');

  // Fake video data
  for (let i = 0; i < 3; i++) {
    const entry = xml.ele('entry');
    entry.ele('id', `tag:youtube.com,2008:video:dummy${i}`);
    entry.ele('title', `Test Upload Video ${i}`);
    entry.ele('published', new Date().toISOString());
    entry.ele('updated', new Date().toISOString());
    entry.ele('link', { rel: 'alternate', type: 'text/html', href: `http://www.youtube.com/watch?v=dummy${i}` });

    const mediaGroup = entry.ele('media:group');
    mediaGroup.ele('media:title', `Test Upload Video ${i}`);
    mediaGroup.ele('media:thumbnail', { url: 'http://img.youtube.com/vi/dummy0/default.jpg' });
    mediaGroup.ele('media:content', {
      url: `http://www.youtube.com/v/dummy${i}`,
      type: 'application/x-shockwave-flash',
      medium: 'video'
    });
  }

  res.type('application/atom+xml');
  res.send(xml.end({ pretty: true }));
});

// Register device endpoint
app.get('/youtube/accounts/registerDevice', (req, res) => {
  const { developer, serialNumber } = req.query;
  if (!developer || !serialNumber) return res.status(400).send('Missing parameters');
  res.send('OK');
});

// Playlist info
app.get('/feeds/api/playlists/:id', (req, res) => {
  const id = req.params.id;
  const xml = builder.create('feed', { encoding: 'UTF-8' })
    .att('xmlns', 'http://www.w3.org/2005/Atom')
    .att('xmlns:media', 'http://search.yahoo.com/mrss/')
    .att('xmlns:yt', 'http://gdata.youtube.com/schemas/2007');

  for (let i = 0; i < 2; i++) {
    const entry = xml.ele('entry');
    entry.ele('id', `tag:youtube.com,2008:video:playlist${id}-${i}`);
    entry.ele('title', `Playlist Video ${i}`);
    entry.ele('published', new Date().toISOString());
    entry.ele('updated', new Date().toISOString());
    entry.ele('link', { rel: 'alternate', type: 'text/html', href: `http://www.youtube.com/watch?v=playlist${id}-${i}` });

    const mediaGroup = entry.ele('media:group');
    mediaGroup.ele('media:title', `Playlist Video ${i}`);
    mediaGroup.ele('media:thumbnail', { url: 'http://img.youtube.com/vi/playlist0/default.jpg' });
    mediaGroup.ele('media:content', {
      url: `http://www.youtube.com/v/playlist${id}-${i}`,
      type: 'application/x-shockwave-flash',
      medium: 'video'
    });
  }

  res.type('application/atom+xml');
  res.send(xml.end({ pretty: true }));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
