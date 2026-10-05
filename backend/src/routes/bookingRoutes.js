const express = require('express');
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { create, update } = require('../validations/bookingValidation');
const { idParamSchema } = require('../validations/commonValidation');

const router = express.Router();

router.use(authMiddleware);
router.use('/:id', validate(idParamSchema, 'params'));

router.get('/', bookingController.list);
router.get('/:id', bookingController.getOne);
router.post('/', validate(create), bookingController.create);
router.put('/:id', validate(update), bookingController.update);
router.delete('/:id', bookingController.remove);

module.exports = router;
