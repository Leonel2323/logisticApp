const express = require('express');
const vehicleController = require('../controllers/vehicleController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { create, update } = require('../validations/vehicleValidation');
const { idParamSchema } = require('../validations/commonValidation');

const router = express.Router();

router.use(authMiddleware);
router.use('/:id', validate(idParamSchema, 'params'));

router.get('/', vehicleController.list);
router.get('/:id', vehicleController.getOne);
router.post('/', validate(create), vehicleController.create);
router.put('/:id', validate(update), vehicleController.update);
router.delete('/:id', vehicleController.remove);

module.exports = router;
