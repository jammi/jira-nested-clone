import { promises as fs } from 'fs';
import path from 'path';
import { lookup } from 'mime-types';

import { delay } from './jira-api-request.mjs';

const handleAttachment = (API_PATH, CACHE_DIR, auth) => {

  // Download attachments locally
  const downloadAttachment = async attachment => {
    const filePath = path.join(CACHE_DIR, `attachment_id=${attachment.id}-${attachment.filename}`);
    if (await fs.stat(filePath).catch(() => null)) {
      console.log(`Attachment ${filePath} already downloaded, skipping.`);
      return filePath;
    }

    const response = await fetch(attachment.content, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download attachment: ${response.statusText}`);
    }

    const responseData = await response.blob();
    await fs.writeFile(filePath, responseData.stream());

    console.log(`Attachment ${filePath} downloaded successfully.`);
    await delay(200);

    return filePath;
  };

  const uploadAttachmentToIssue = async (issueKey, filePath, attachment) => {
    const form = new FormData();

    const file = new Blob([await fs.readFile(filePath)], {type: lookup(filePath)});

    // Append the file buffer
    form.set('file', file, attachment.filename);

    const response = await fetch(`${API_PATH}issue/${issueKey}/attachments`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'X-Atlassian-Token': 'no-check'
      },
      body: form
    });

    if (!response.ok) {
      throw new Error(`Failed to upload attachment: ${response.statusText}`);
    }

    console.log(`Attachment ${filePath} uploaded successfully.`);
    await delay(200);
  };

  // Main function to process attachment transfer
  return async (sourceIssue, targetIssueKey) => {
    try {
      const sourceIssueKey = sourceIssue.key;

      const attachments = sourceIssue.fields.attachment;

      for (const attachment of attachments) {
        const filePath = await downloadAttachment(attachment);
        await uploadAttachmentToIssue(targetIssueKey, filePath, attachment);

        // Optionally delete the temporary file
        // await fs.unlink(filePath);
      }
    } catch (error) {
      console.error(`Error during attachment processing: ${error.message}`);
    }
  };


};
export { handleAttachment };
