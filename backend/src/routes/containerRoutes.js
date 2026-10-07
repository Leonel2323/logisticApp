const express = require('express');
const containerController = require('../controllers/containerController');
const { authenticate } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { create, update } = require('../validations/containerValidation');
const { idParamSchema } = require('../validations/commonValidation');

const router = express.Router();

router.use(authenticate);
router.use('/:id', validate(idParamSchema, 'params'));

router.get('/', containerController.list);
router.get('/:id', containerController.getOne);
router.post('/', validate(create), containerController.create);
router.put('/:id', validate(update), containerController.update);
router.delete('/:id', containerController.remove);

module.exports = router;
