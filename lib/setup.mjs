import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs'; // Use promises API from fs
import { handleAttachment } from './attachments.mjs';
import { handleComment } from './comments.mjs';

import {
  JIRA_BASE_URL,
  SOURCE_PROJECT_KEY,
  TARGET_PROJECT_KEY,
  JIRA_USER_EMAIL,
  JIRA_API_TOKEN,
  SOURCE_ISSUE_ID,
  API_PATH,
  CUSTOM_FIELDS,

  COPY_CLONE_ORIGIN_COMMENTS,
  DEBUG_OUTPUT,
  VERBOSE_OUTPUT
} from './parse-env.mjs';


// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define the cache directory in the parent directory
const CACHE_DIR = join(__dirname, '../cache');

// Ensure the cache directory exists
try {
  try {
    await fs.stat(CACHE_DIR);
  }
  catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
    else {
      DEBUG_OUTPUT && console.log(`Cache directory not found at: ${CACHE_DIR}; trying to create it...`);
      await fs.mkdir(CACHE_DIR, { recursive: true }); // Create cache directory if it doesn't exist
      VERBOSE_OUTPUT && console.log(`Cache directory created at: ${CACHE_DIR}`);
    }
  }
}
catch (error) {
  console.error(`Failed to create cache directory: ${error.message}`);
  throw error;
}

const auth = Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

const alwaysSkipFields = [
  'aggregateprogress', 'aggregatetimeestimate', 'aggregatetimeoriginalestimate', 'aggregatetimespent',
  'comment',
  'components',
  'creator',
  'created',
  'environment',
  'fixVersions',
  'lastViewed',
  'parent', // because we'll reconstruct the parent based on the tree structure
  'updated',
  'issuelinks', // because we'll reconstruct the issuelinks based on the tree structure
  'issuerestriction',
  'progress',
  'priority',
  'reporter',
  'resolution',
  'resolutiondate',
  'security',
  'status',
  'statusCategory',
  'statuscategorychangedate',
  'subtasks', // because we'll reconstruct the subtasks based on the tree structure
  'timespent', 'timeoriginalestimate', 'timeestimate', 'timetracking',
  'versions',
  'votes',
  'watches',
  'worklog',
  'workratio',
];

// handlers for fields requiring special handling before issue insertion
const handleFieldPreClone = {
  issuetype: ({ name }) => ({ name }),

  // doesn't seem to work
  reporter: ({ accountId, emailAddress, displayName }) => ({
    accountId
  }),
};

// handlers for fields requiring special handling after issue insertion
const handleFieldPostClone = {
  // returns async handler that takes the source issue and the target issue key
  attachment: handleAttachment({API_PATH, CACHE_DIR, auth}),

  // insert Jira comment that says which source project key and issue key was the source, with a link to the sourceissue.self url
  comments: handleComment({JIRA_BASE_URL, COPY_CLONE_ORIGIN_COMMENTS, API_PATH, CACHE_DIR, auth})
};

const SKIP_FIELDS = [...alwaysSkipFields, ...Object.keys(handleFieldPostClone), ...(process.env.SKIP_FIELDS ? process.env.SKIP_FIELDS.split(',') : [])];

export {
  CACHE_DIR,
  API_PATH, SOURCE_ISSUE_ID, auth,
  SOURCE_PROJECT_KEY,
  TARGET_PROJECT_KEY,
  CUSTOM_FIELDS, SKIP_FIELDS,
  handleFieldPostClone, handleFieldPreClone
};
