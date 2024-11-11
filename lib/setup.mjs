import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs'; // Use promises API from fs
import { handleAttachment } from './attachments.mjs';
import { makeJiraApiRequest } from './jira-api-request.mjs';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define the cache directory in the parent directory
const CACHE_DIR = join(__dirname, '../cache');

// Ensure the cache directory exists
try {
  await fs.mkdir(CACHE_DIR, { recursive: true }); // Create cache directory if it doesn't exist
  console.log(`Cache directory created at: ${CACHE_DIR}`);
} catch (error) {
  console.error(`Failed to create cache directory: ${error.message}`);
}

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const SOURCE_PROJECT_KEY = process.env.SOURCE_PROJECT_KEY;
const TARGET_PROJECT_KEY = process.env.TARGET_PROJECT_KEY;
const JIRA_USER_EMAIL = process.env.JIRA_USER_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const SOURCE_ISSUE_ID = process.env.SOURCE_ISSUE_ID;
const API_PATH = `${JIRA_BASE_URL}/rest/api/3/`;
const auth = Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
const CUSTOM_FIELDS = process.env.CUSTOM_FIELDS ? process.env.CUSTOM_FIELDS.split(',') : [];
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
  attachment: handleAttachment(API_PATH, CACHE_DIR, auth),

  // insert Jira comment that says which source project key and issue key was the source, with a link to the sourceissue.self url
  comments: async (sourceIssue, targetIssueKey) => {
    const originalIssueUrl = JIRA_BASE_URL + '/issues/' + sourceIssue.key;
    const comment = {
      body: {
        type: 'doc',
        version: 1,
        content: [{
          type: 'paragraph',
          content: [{
            type: 'text',
            text: 'This issue was cloned from '
          }, {
            type: 'text',
            text: `${ sourceIssue.fields.project.name} ${ sourceIssue.key }`,
            marks: [{
              type: 'link',
              attrs: { href: originalIssueUrl }
            }]
          }]
        }]
      }
    };

    const jiraApiRequest = makeJiraApiRequest(API_PATH, CACHE_DIR, auth);
    await jiraApiRequest(`issue/${targetIssueKey}/comment`, 'POST', comment);
  }
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
