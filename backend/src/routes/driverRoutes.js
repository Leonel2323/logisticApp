const express = require('express');
const driverController = require('../controllers/driverController');
const { authenticate } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { create, update } = require('../validations/driverValidation');
const { idParamSchema } = require('../validations/commonValidation');

const router = express.Router();

router.use(authenticate);
router.use('/:id', validate(idParamSchema, 'params'));

router.get('/', driverController.list);
router.get('/:id', driverController.getOne);
router.post('/', validate(create), driverController.create);
router.put('/:id', validate(update), driverController.update);
router.delete('/:id', driverController.remove);

module.exports = router;
