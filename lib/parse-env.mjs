
const parseEnvDefined = envVarName => {
  const envValue = process.env[envVarName];
  if (!envValue) {
    throw new Error(`Missing required environment variable: ${envVarName}`);
  }
  return envValue;
};

const parseEnvBool = (envVarName, defaultValue = false) => {
  const envValue = process.env[envVarName];
  if (!envValue) {
    return defaultValue;
  }
  const value = envValue.toLowerCase();
  const isTrue = ['true', '1', 'yes'].includes(value);
  const isFalse = ['false', '0', 'no'].includes(value);
  if (!isTrue &&  !isFalse) {
    throw new Error(`Invalid value for ${envVarName}: ${envValue}`);
  }
  return isTrue;
};

const JIRA_BASE_URL = parseEnvDefined('JIRA_BASE_URL');
const SOURCE_PROJECT_KEY = parseEnvDefined('SOURCE_PROJECT_KEY');
const TARGET_PROJECT_KEY = parseEnvDefined('TARGET_PROJECT_KEY');
const JIRA_USER_EMAIL = parseEnvDefined('JIRA_USER_EMAIL');
const JIRA_API_TOKEN = parseEnvDefined('JIRA_API_TOKEN');
const SOURCE_ISSUE_ID = parseEnvDefined('SOURCE_ISSUE_ID');
const API_PATH = `${JIRA_BASE_URL}/rest/api/3/`;
const CUSTOM_FIELDS = process.env.CUSTOM_FIELDS ? process.env.CUSTOM_FIELDS.split(',') : [];

const COPY_CLONE_ORIGIN_COMMENTS = parseEnvBool('COPY_CLONE_ORIGIN_COMMENTS', false);
const DEBUG_OUTPUT = parseEnvBool('DEBUG_OUTPUT', false);
const VERBOSE_OUTPUT = parseEnvBool('VERBOSE_OUTPUT', true);

export {
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
};
