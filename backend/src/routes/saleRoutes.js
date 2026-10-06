const express = require('express');
const saleController = require('../controllers/saleController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { create, update } = require('../validations/saleValidation');
const { idParamSchema } = require('../validations/commonValidation');

const router = express.Router();

router.use(authMiddleware);
router.use('/:id', validate(idParamSchema, 'params'));

router.get('/', saleController.list);
router.get('/:id', saleController.getOne);
router.post('/', validate(create), saleController.create);
router.put('/:id', validate(update), saleController.update);
router.delete('/:id', saleController.remove);

module.exports = router;
