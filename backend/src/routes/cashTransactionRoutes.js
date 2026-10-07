const express = require('express');
const cashTransactionController = require('../controllers/cashTransactionController');
const { authenticate } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { create, update } = require('../validations/cashTransactionValidation');
const { idParamSchema } = require('../validations/commonValidation');

const router = express.Router();

router.use(authenticate);
router.use('/:id', validate(idParamSchema, 'params'));

router.get('/', cashTransactionController.list);
router.get('/:id', cashTransactionController.getOne);
router.post('/', validate(create), cashTransactionController.create);
router.put('/:id', validate(update), cashTransactionController.update);
router.delete('/:id', cashTransactionController.remove);

module.exports = router;
