const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hey, World!');
});

app.listen(port, () => {
  console.log(`Express app listening at http://localhost:${port}`);
});
 
