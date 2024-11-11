import { jiraApiRequest } from 'jira-nested-clone/api';
import { SOURCE_ISSUE_ID } from 'jira-nested-clone/setup';

const jiraIssue = async key => jiraApiRequest(`issue/${key}?expand=attachment,subtasks,issuelinks`);

const getFields = async () =>
  jiraApiRequest('field')
    .then(data => data
      .sort(({id: a}, {id: b}) => {
        const neitherCustom = !a.startsWith('customfield_') && !b.startsWith('customfield_');
        const bothCustom = a.startsWith('customfield_') && b.startsWith('customfield_');
        if (neitherCustom || bothCustom) return a.localeCompare(b);
        return a.startsWith('customfield_') ? 1 : -1;
      })
      .reduce((out, {id, key, name, ...fields}) => ({
        ...out,
        [id || key]: {id, key, name, ...fields}
      }), {}));

const prettyPrintFields = fields => {
  console.log('Fields:');
  for (const [key, field] of Object.entries(fields)) {
    if (!field?.id) {
      console.log({key, field})
    }
    console.log(`- ${field.id}: ${field.name} (${field.schema?.type})`);
  }
};

const fields = await getFields()

if (SOURCE_ISSUE_ID) {
  const sourceIssue = await jiraIssue(SOURCE_ISSUE_ID);
  console.log('Custom Fields for Source Issue:');
  for (const fieldId of Object.keys(fields).sort()) {
    const value = sourceIssue.fields[fieldId];
    if (!value) continue;
    const fieldName = fields[fieldId]?.name || fieldId;
    console.log(`${fieldId} (${fieldName}):`, value);
  }
}
else {
  prettyPrintFields(fields);
}
