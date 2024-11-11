import { promises as fs } from 'fs'; // Use promises API from fs
import { fileURLToPath } from 'url';
import { dirname, join as joinPath } from 'path';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const makeCacheUtils = (cacheDir, cachePrefix, endpoint) => {
  const cacheFilePath = joinPath(cacheDir, `${cachePrefix}${endpoint.replace(/\//g, '_')}.json`);

  const readCached = async () => {
    try {
      if (await fs.stat(cacheFilePath)) {
        console.log(`Fetching ${endpoint} from cache.`);
        const data = await fs.readFile(cacheFilePath, 'utf8');
        return JSON.parse(data); // Return cached data
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Error checking cache for ${endpoint}: ${error.message}`);
      }
    }
    return null; // Return null if cache file doesn't exist
  };

  const writeToCache = async (data) => {
    await fs.writeFile(cacheFilePath, JSON.stringify(data, null, 2));
  };

  return { writeToCache, readCached };
};

const makeJiraApiRequest = (API_PATH, CACHE_DIR, auth, cachePrefix='', debugOutput=false) => {

  // Function for making requests to the Jira API with caching
  const jiraApiRequest = async (endpoint, method = 'GET', body = null, retries = 5) => {

    const { writeToCache, readCached } = makeCacheUtils(CACHE_DIR, cachePrefix, endpoint);

    // If the method is GET, check for cached data
    if (method === 'GET') {
      const cachedData = await readCached();
      if (cachedData) {
        return cachedData;
      }
    }

    if (method !== 'GET' && body && debugOutput) {
      console.log(`${method} body of ${endpoint}: ${JSON.stringify(body, null, 2)}`);
    }

    const options = {
      method: method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      ...(body && { body: JSON.stringify(body) }) // Use spread to include body if it exists
    };

    const url = `${API_PATH}${endpoint}`;
    console.log(`Making ${method} request to ${url}.`);
    const response = await fetch(url, options);

    const responseBody = await response.json().catch(() => ({})); // Handle non-JSON responses
    if (!response.ok) {
      console.error("Request body:", body); // Log the raw request body
      console.error("Response body:", responseBody); // Log the raw response body
      if (retries > 0) {
        console.error(`Error fetching from Jira: ${response.statusText}`);
        console.warn(`Retrying ${retries} more times...`);
        await delay(1000 * (5 - retries)); // Delay 1, 2, 3, 4
        return jiraApiRequest(endpoint, method, body, retries - 1);
      }
      else {
        throw new Error(`Error fetching from Jira: ${responseBody.errorMessages?.join(', ') || response.statusText}`);
      }
    }

    // If the method is GET, cache the fetched data
    if (method === 'GET') {
      await writeToCache(responseBody);
      console.log(`Fetched ${endpoint} from Jira and cached.`);
    }

    await delay(500);
    return responseBody;
  };

  return jiraApiRequest;
};

export { makeJiraApiRequest, makeCacheUtils, delay };
