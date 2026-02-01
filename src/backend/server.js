const startBackendServer = require('./api');
const { PORT } = require('../shared/constants');

const port = process.env.PORT || PORT;

startBackendServer(port).then(() => {
  if (process.send) {
    process.send('ready');
  }
});
