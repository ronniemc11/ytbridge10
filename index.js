const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/feeds/api/videos', (req, res) => {
  res.set('Content-Type', 'application/atom+xml');
  res.send('<?xml version="1.0"?><feed><entry><title>OK</title></entry></feed>');
});

app.listen(PORT, () => {
  console.log(`👍 Minimal server running on port ${PORT}`);
});
