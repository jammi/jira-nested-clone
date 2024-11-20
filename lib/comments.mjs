import { makeJiraApiRequest } from './jira-api-request.mjs';

const findCommentBySelf = sourceIssue => {
  const fieldComments = sourceIssue.fields?.comment?.comments;
  if (!fieldComments?.find) {
    return;
  }
  const foundComment = fieldComments.find(comment => {
    const sourceContentBodyContent = comment?.body?.content[0];
    if (
      sourceContentBodyContent && sourceContentBodyContent.type === 'paragraph' &&
      sourceContentBodyContent.content.length === 2
    ) {
      return sourceContentBodyContent.content[0].text === 'This issue was cloned from ';
    }
  });
  return foundComment;
};


const handleComment = ({
  JIRA_BASE_URL, COPY_CLONE_ORIGIN_COMMENTS, API_PATH, CACHE_DIR, auth
}) => {
  const jiraApiRequest = makeJiraApiRequest(API_PATH, CACHE_DIR, auth);
  return async (sourceIssue, targetIssueKey) => {
    const originalIssueUrl = JIRA_BASE_URL + '/issues/' + sourceIssue.key;

    // the default commentBody is a simple message indicating the issue was cloned from another issue
    let commentBody = {
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
    };

    // Special handling for the comment body if the source issue has a comment
    // that indicates it was cloned from another issue,
    // preserving the original rather than the intermittent clone.
    //
    // Useful when you collect issue set templates to a temp project
    // from a source project.
    if (COPY_CLONE_ORIGIN_COMMENTS) {
      const foundComment = findCommentBySelf(sourceIssue);
      if (foundComment) {
        commentBody = foundComment.body.content[0];
      }
    }

    // create the comment object
    const comment = {
      body: {
        type: 'doc',
        version: 1,
        content: [commentBody]
      }
    };

    // post the comment to the target issue
    await jiraApiRequest(`issue/${targetIssueKey}/comment`, 'POST', comment);
  };
};

export { handleComment };
