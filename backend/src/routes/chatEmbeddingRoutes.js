const express = require('express');
const chatEmbeddingController = require('../controllers/chatEmbeddingController');
const { authenticate } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { create, update } = require('../validations/chatEmbeddingValidation');
const { idParamSchema } = require('../validations/commonValidation');

const router = express.Router();

router.use(authenticate);
router.use('/:id', validate(idParamSchema, 'params'));

router.get('/', chatEmbeddingController.list);
router.get('/:id', chatEmbeddingController.getOne);
router.post('/', validate(create), chatEmbeddingController.create);
router.put('/:id', validate(update), chatEmbeddingController.update);
router.delete('/:id', chatEmbeddingController.remove);

module.exports = router;
