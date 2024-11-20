import { jiraApiRequest } from './api.mjs';

import { DEBUG_OUTPUT } from './parse-env.mjs';

// fetch root level issue, typically epic
const fetchIssues = async (rootKey, cache = {}) => {

  const processSubtasks = async subtasks => {
    const list = [];
    for (const {key} of subtasks) {
      list.push(key);
      await processIssue(key);
    }
    return list;
  };

  const jiraEpicSearch = async key => jiraApiRequest(`search?jql=parent=${key}`);

  const processEpicList = async key => {
    const { issues } = await jiraEpicSearch(key);
    return processSubtasks(issues);
  };

  const processLinks = async links => {
    const list = [];
    for (const link of links) {
      const type = link.type.name;
      for (const direction of ['in', 'out']) {
        const linkObject = link[`${direction}wardIssue`];
        if (linkObject) {
          const key = linkObject.key;
          await processIssue(key);
          list.push({ key, type, direction });
        }
      }
    }
    return list;
  };

  const jiraIssue = async key => jiraApiRequest(`issue/${key}?expand=attachment,subtasks,issuelinks`);

  // fetch data of single issue, branch based on structure found
  // build processed node with original fields attached
  const processIssue = async key => {

    if (cache[key]) {
      DEBUG_OUTPUT && console.log('Already processed:', key);
      return cache;
    }

    const { fields } = await jiraIssue(key);

    const node = {
      key,
      parent: fields.parent?.key || null,
      summary: fields.summary,
      type: fields.issuetype.name,
      links: [],
      subtasks: [],
      fields
    };
    cache[key] = node;

    if (node.type === 'Epic') {
      node.subtasks = await processEpicList(key);
    }
    else if (fields.subtasks) {
      node.subtasks = await processSubtasks(fields.subtasks);
    }

    if (fields.issuelinks) {
      node.links = await processLinks(fields.issuelinks);
    }


    return node;
  };

  await processIssue(rootKey);

  return cache;
};

export { fetchIssues };
