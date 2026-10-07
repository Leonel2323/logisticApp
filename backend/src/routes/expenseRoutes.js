const express = require('express');
const expenseController = require('../controllers/expenseController');
const { authenticate } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { create, update } = require('../validations/expenseValidation');
const { idParamSchema } = require('../validations/commonValidation');

const router = express.Router();

router.use(authenticate);
router.use('/:id', validate(idParamSchema, 'params'));

router.get('/', expenseController.list);
router.get('/:id', expenseController.getOne);
router.post('/', validate(create), expenseController.create);
router.put('/:id', validate(update), expenseController.update);
router.delete('/:id', expenseController.remove);

module.exports = router;
