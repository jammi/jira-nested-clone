import { SOURCE_ISSUE_ID, TARGET_PROJECT_KEY } from './lib/setup.mjs';
import { fetchIssues } from './lib/issue.mjs';
import { cloneStructure } from './lib/clone.mjs';
import { logTreeStructure } from './lib/log.mjs';

import { DEBUG_OUTPUT, VERBOSE_OUTPUT } from './lib/parse-env.mjs';

const cache = await fetchIssues(SOURCE_ISSUE_ID);

if (VERBOSE_OUTPUT) {
  console.log("Tree Structure:");
  logTreeStructure(cache, SOURCE_ISSUE_ID);
}

// process.exit();

const { clonedKey } = await cloneStructure(SOURCE_ISSUE_ID, TARGET_PROJECT_KEY, cache);

if (VERBOSE_OUTPUT) {
  console.log(`Cloned Root Key: ${clonedKey}`);
}
else {
  console.log(clonedKey);
}

const cloned = await fetchIssues(clonedKey);

if (VERBOSE_OUTPUT) {
  console.log("Cloned Structure:");
  logTreeStructure(cloned, clonedKey);
}
