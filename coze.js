import { CozeAPI, COZE_CN_BASE_URL } from '@coze/api';

/**
 * Coze API client wrapper for handling file uploads and workflow execution
 */
export class CozeService {
  constructor(apiKey) {
    this.client = new CozeAPI({
      baseURL: COZE_CN_BASE_URL,
      token: apiKey,
      allowPersonalAccessTokenInBrowser: true
    });
  }

  /**
   * Upload a file to Coze platform
   * @param {File|Blob} file - The file to upload
   * @returns {Promise<{data: {id: string, bytes: number, created_at: number, file_name: string}}>} The uploaded file information
   */
  async uploadFile(file) {
    try {
      const response = await this.client.files.upload({ file });
      return response;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Execute a workflow
   * @param {string} workflowId - The ID of the workflow to execute
   * @param {Object} params - The parameters for the workflow execution
   * @param {string} [params.bot_id] - Optional bot ID associated with the workflow
   * @param {Object} [params.parameters] - Optional workflow execution parameters
   * @param {Object} [params.ext] - Optional additional information
   * @param {string} [params.app_id] - Optional app ID for chat
   * @returns {Promise<{data: string, cost: string, token: number, msg: string, debug_url: string, execute_id: string}>} The workflow execution result
   */
  async executeWorkflow(workflowId, params = {}) {
    try {
      const response = await this.client.workflows.runs.create({
        workflow_id: workflowId,
        app_id: params.app_id,
        ...params
      });
      return response;
    } catch (error) {
      console.error('Error executing workflow:', error);
      throw error;
    }
  }
}

// Example usage:
/*
const cozeService = new CozeService('your-api-key');

// Upload a file
const file = new File(['content'], 'example.txt', { type: 'text/plain' });
const uploadResult = await cozeService.uploadFile(file);

// Execute a workflow
const workflowResult = await cozeService.executeWorkflow('workflow-id', {
  param1: 'value1',
  param2: 'value2'
});
*/
