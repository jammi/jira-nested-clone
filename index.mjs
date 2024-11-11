import { SOURCE_ISSUE_ID, TARGET_PROJECT_KEY } from 'jira-nested-clone/setup';
import { fetchIssues } from 'jira-nested-clone/issue';
import { cloneStructure } from 'jira-nested-clone/clone';
import { logTreeStructure } from 'jira-nested-clone/log';

// Execute the main function using top-level await
const cache = await fetchIssues(SOURCE_ISSUE_ID);
// console.log("Cache:", cache);
console.log("Tree Structure:");
logTreeStructure(cache, SOURCE_ISSUE_ID);

// Clone the structure and log results
const clonedRootKey = await cloneStructure(SOURCE_ISSUE_ID, TARGET_PROJECT_KEY, cache);
console.log(`Cloned Root Key: ${clonedRootKey}`);

// Log the cloned structure
console.log("Cloned Structure:");
const cloned = await fetchIssues(clonedRootKey); // Fetch the cloned structure
logTreeStructure(cloned, clonedRootKey);
