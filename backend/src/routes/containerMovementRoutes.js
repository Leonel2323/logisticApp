const express = require('express');
const containerMovementController = require('../controllers/containerMovementController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { create, update } = require('../validations/containerMovementValidation');
const { idParamSchema } = require('../validations/commonValidation');

const router = express.Router();

router.use(authMiddleware);
router.use('/:id', validate(idParamSchema, 'params'));

router.get('/', containerMovementController.list);
router.get('/:id', containerMovementController.getOne);
router.post('/', validate(create), containerMovementController.create);
router.put('/:id', validate(update), containerMovementController.update);
router.delete('/:id', containerMovementController.remove);

module.exports = router;
