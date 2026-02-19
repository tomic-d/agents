import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

process.loadEnvFile(resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env'));

import '#providers/load.js';
import agents from '#agents/addon.js';

/* Functions */
import '#agents/functions/parse.js';
import '#agents/item/functions/run.js';

export default agents;