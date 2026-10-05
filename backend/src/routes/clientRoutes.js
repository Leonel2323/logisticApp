const express = require('express');
const clientController = require('../controllers/clientController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { create, update } = require('../validations/clientValidation');
const { idParamSchema } = require('../validations/commonValidation');

const router = express.Router();

router.use(authMiddleware);
router.use('/:id', validate(idParamSchema, 'params'));

router.get('/', clientController.list);
router.get('/:id', clientController.getOne);
router.post('/', validate(create), clientController.create);
router.put('/:id', validate(update), clientController.update);
router.delete('/:id', clientController.remove);

module.exports = router;
