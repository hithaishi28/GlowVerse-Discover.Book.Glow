import { app } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';

connectDb()
  .then(() => {
    app.listen(env.port, () => console.log(`GlowVerse API listening on ${env.port}`));
  })
  .catch((error) => {
    console.error('Failed to start server', error);
    process.exit(1);
  });
