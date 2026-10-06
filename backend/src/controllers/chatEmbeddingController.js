const chatEmbeddingModel = require('../models/chatEmbeddingModel');
const { success, failure } = require('../utils/apiResponse');

async function list(req, res, next) {
  try {
    const embeddings = await chatEmbeddingModel.findAll();
    return success(res, embeddings);
  } catch (err) {
    return next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const embedding = await chatEmbeddingModel.findById(req.params.id);
    if (!embedding) return failure(res, 'Embedding not found', 404);
    return success(res, embedding);
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const embedding = await chatEmbeddingModel.create(req.body);
    return success(res, embedding, 201);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const embedding = await chatEmbeddingModel.update(req.params.id, req.body);
    if (!embedding) return failure(res, 'Embedding not found', 404);
    return success(res, embedding);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    await chatEmbeddingModel.remove(req.params.id);
    return success(res, null, 204);
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
