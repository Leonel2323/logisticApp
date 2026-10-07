const express = require('express');
const fuelController = require('../controllers/fuelController');
const { authenticate } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { create, update } = require('../validations/fuelValidation');
const { idParamSchema } = require('../validations/commonValidation');

const router = express.Router();

router.use(authenticate);
router.use('/:id', validate(idParamSchema, 'params'));

router.get('/', fuelController.list);
router.get('/:id', fuelController.getOne);
router.post('/', validate(create), fuelController.create);
router.put('/:id', validate(update), fuelController.update);
router.delete('/:id', fuelController.remove);

module.exports = router;
