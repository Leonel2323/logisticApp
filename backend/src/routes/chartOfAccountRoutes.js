const express = require('express');
const chartOfAccountController = require('../controllers/chartOfAccountController');
const { authenticate } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { create, update } = require('../validations/chartOfAccountValidation');
const { idParamSchema } = require('../validations/commonValidation');

const router = express.Router();

router.use(authenticate);
router.use('/:id', validate(idParamSchema, 'params'));

router.get('/', chartOfAccountController.list);
router.get('/:id', chartOfAccountController.getOne);
router.post('/', validate(create), chartOfAccountController.create);
router.put('/:id', validate(update), chartOfAccountController.update);
router.delete('/:id', chartOfAccountController.remove);

module.exports = router;
