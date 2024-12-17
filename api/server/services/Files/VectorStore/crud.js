const fs = require('fs');
const { FilePurpose } = require('librechat-data-provider');
const axios = require('axios');
const { getOpenAIClient } = require('../../../controllers/assistants/helpers');
const { logger } = require('~/config');

/**
 *
 * @param {OpenAIClient} openai - The initialized OpenAI client.
 * @returns
 */
async function createVectorStore(openai) {
  try {
    const response = await openai.beta.vectorStores.create({
      name: 'Financial Statements',
    });
    return response.id;
  } catch (error) {
    logger.error('[createVectorStore] Error creating vector store:', error.message);
    throw error;
  }
}

/**
 * Uploads a file to Azure OpenAI Vector Store for file search.
 *
 * @param {Object} params - The parameters for the upload.
 * @param {Express.Multer.File} params.file - The file uploaded to the server via multer.
 * @param {OpenAIClient} params.openai - The initialized OpenAI client.
 * @param {string} [params.vectorStoreId] - The ID of the vector store.
 * @returns {Promise<Object>} The response from Azure containing the file details.
 */
async function uploadToVectorStore({ openai, file, vectorStoreId }) {
  try {
    const filePath = file.path;
    const fileStreams = [fs.createReadStream(filePath)];
    const response = await openai.beta.vectorStores.fileBatches.uploadAndPoll(vectorStoreId, {
      files: fileStreams,
    });
    logger.debug(
      `[uploadToVectorStore] Successfully uploaded file to Azure Vector Store: ${response.id}`,
    );
    return {
      id: response.vector_store_id,
    };
  } catch (error) {
    logger.error('[uploadToVectorStore] Error uploading file:', error.message);
    throw new Error(`Failed to upload file to Vector Store: ${error.message}`);
  }
}

/**
 * Deletes a file from Azure OpenAI Vector Store.
 *
 * @param {Object} params - The parameters for the upload.
 * @param {OpenAIClient} openai - The initialized OpenAI client.
 * @param {Express.Multer.File} params.file - The file uploaded to the server via multer.
 * @returns {Promise<void>}
 */
async function deleteFromVectorStore(req, file, openai) {
  try {
    const res = await openai.beta.vectorStores.del(file.file_id);

    if (!res.deleted) {
      throw new Error('OpenAI returned `false` for deleted status');
    }
    logger.debug(
      `[deleteOpenAIFile] User ${req.user.id} successfully deleted ${file.file_id} from OpenAI`,
    );
  } catch (error) {
    logger.error('[deleteOpenAIFile] Error deleting file from OpenAI: ' + error.message);
    throw error;
  }
}

module.exports = { uploadToVectorStore, deleteFromVectorStore, createVectorStore };
