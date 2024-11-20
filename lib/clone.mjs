import { jiraApiRequest } from './api.mjs';
import { SOURCE_PROJECT_KEY, CUSTOM_FIELDS, SKIP_FIELDS, handleFieldPreClone, handleFieldPostClone } from './setup.mjs';
import { fetchIssues } from './issue.mjs'; // Importing fetchIssues for getting issue details

import { DEBUG_OUTPUT, VERBOSE_OUTPUT } from './parse-env.mjs';

// Function to clone the entire structure by creating new issues
const cloneStructure = async (rootKey, targetProjectKey, cache = null) => {

  // Fetch the issues if cache is not provided
  if (cache === null) {
    cache = await fetchIssues(rootKey);
  }

  const linkMap = {}; // Map to store the link between original and cloned issues
  const linkQueue = []; // Queue to store the links to be processed

  const processFields = async fields => {
    const processedFields = {};

    for (const [fieldKey, field] of Object.entries(fields)) {
      if (SKIP_FIELDS.includes(fieldKey)) {
        continue; // Skip the field if it's in the skip list
      }

      if (handleFieldPreClone[fieldKey]) {
        const handler = handleFieldPreClone[fieldKey];
        processedFields[fieldKey] = await handler(field); // Use the handler to process the field
        continue;
      }

      if (fieldKey.startsWith('customfield_') && !CUSTOM_FIELDS.includes(fieldKey)) {
        continue;
      }

      processedFields[fieldKey] = field; // Copy the field as is
    }

    return processedFields;
  };

  // Function to create a new issue in the target project
  const createIssue = async (issue, targetProjectKey) => {
    const fields = await processFields(issue.fields);
    let parentKey = null;

    if (issue.type === 'Epic' && !issue.parent) {
      parentKey = null; // this is fine
    }
    else if (!issue.parent && issue.type === 'Sub-task') {
      throw new Error(`Sub-task ${issue.key} issue missing parent: ${issue.parent}`);
    }
    else if (issue.parent) {
      if (linkMap[issue.parent]) {
        parentKey = { key: linkMap[issue.parent] };
      }
      else {
        throw new Error(`Parent issue not found in linkMap: ${issue.parent}`);
      }
    }

    DEBUG_OUTPUT && console.log(`Cloning issue: ${issue.key} into project: ${targetProjectKey}`, {parentKey});

    const newIssueData = {
      fields: {
        ...fields,
        project: { key: targetProjectKey },
        parent: parentKey
      }
    };

    const { key: newKey } = await jiraApiRequest('issue', 'POST', newIssueData);

    for (const [fieldKey, field] of Object.entries(issue.fields)) {
      if (handleFieldPostClone[fieldKey] && field) {
        const handler = handleFieldPostClone[fieldKey];
        await handler(issue, newKey);
      }
    }
    await handleFieldPostClone.comments(issue, newKey);

    VERBOSE_OUTPUT && console.info(`Cloned issue: ${issue.key} => ${newKey}`);

    return newKey;
  };

  const isInSourceProject = key => key.startsWith(`${SOURCE_PROJECT_KEY}-`);

  const processedKeys = new Set(); // Set to store the processed issue keys

  const ensureParentsExist = async key => {
    const issue = cache[key];
    const parent = issue.parent;
    if (parent !== null) {
      if (!processedKeys.has(parent)) {
        await cloneSub(parent);
      }
    }
  };

  const cloneSub = async oldKey => {
    await ensureParentsExist(oldKey);
    if (processedKeys.has(oldKey)) {
      DEBUG_OUTPUT && console.warn(`Skipping already processed issue: ${oldKey}`);
      return; // Skip if the issue has already been processed
    }

    const issue = cache[oldKey];
    const newKey = await createIssue(issue, targetProjectKey);

    processedKeys.add(oldKey); // Add the new issue key to the set

    const children = [];

    linkMap[oldKey] = newKey; // Map the original issue key to the new issue key

    DEBUG_OUTPUT && console.log(`Cloning links for ${oldKey} => ${newKey}:`, issue.links);
    if (issue.links) {
      for (const { key: oldTargetKey, type, direction } of issue.links) {
        if (!isInSourceProject(oldTargetKey)) {
          DEBUG_OUTPUT && console.log(`Skipping external link: ${oldTargetKey}`);
          linkQueue.push({ sourceKey: newKey, oldTargetKey, type, direction });
          linkMap[oldTargetKey] = oldTargetKey;
          processedKeys.add(oldTargetKey);
        }
        else {
          linkQueue.push({ sourceKey: newKey, oldTargetKey, type, direction });
          if (!children.includes(oldTargetKey)) {
            children.push(oldTargetKey);
          }
        }
      }
    }

    DEBUG_OUTPUT && console.log(`Cloning subtasks for ${oldKey} => ${newKey}:`, issue.subtasks);
    if (issue.subtasks) {
      for (const subtaskKey of issue.subtasks) {
        if (!children.includes(subtaskKey)) {
          children.push(subtaskKey);
        }
      }
    }

    // Clone child issues (linked tasks) sequentially
    for (const childKey of children) {
      DEBUG_OUTPUT && console.log(`Cloning child issue: ${childKey}`);
      await cloneSub(childKey);
    }

    return newKey;
  }

  const clonedKey = await cloneSub(rootKey);

  for (const link of linkQueue) {
    const { sourceKey, type, direction, oldTargetKey } = link;
    if (direction !== 'out') {
      continue;
    }
    const newTargetKey = linkMap[oldTargetKey];
    const linkBody = {
      type: { name: type },
      inwardIssue: { key: sourceKey },
      outwardIssue: { key: newTargetKey }
    };
    try {
      await jiraApiRequest(`issueLink`, 'POST', linkBody, 2);
    }
    catch (err) {
      console.error('Linking failed:', err.message, {linkBody});
    }
  }

  return {clonedKey, linkMap};
};

export { cloneStructure };
