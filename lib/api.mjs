import { API_PATH, CACHE_DIR, auth } from './setup.mjs';

import { makeJiraApiRequest } from './jira-api-request.mjs';

const jiraApiRequest = makeJiraApiRequest(API_PATH, CACHE_DIR, auth);

export { jiraApiRequest };
