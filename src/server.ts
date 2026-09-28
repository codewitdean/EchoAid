import { createApp } from './app.js';
import { env } from './config/env.js';

createApp()
  .then((app) => {
    app.listen(env.port, () => {
      console.log(`EchoAid backend listening on http://localhost:${env.port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start EchoAid backend:', error);
    process.exit(1);
  });
