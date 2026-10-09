const express = require('express');
const bookingController = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { create, update, list } = require('../validations/bookingValidation');
const { idParamSchema } = require('../validations/commonValidation');

const router = express.Router();

router.use(authenticate);

// Enregistrée avant le middleware générique `/:id` ci-dessous : sinon
// "shipping-companies" serait intercepté comme une valeur de :id et
// échouerait la validation Joi (qui attend un entier).
router.get('/shipping-companies', bookingController.shippingCompanies);

router.use('/:id', validate(idParamSchema, 'params'));

router.get('/', validate(list, 'query'), bookingController.list);
router.get('/:id', bookingController.detail);
router.get('/:id/stats', bookingController.stats);
router.post('/', authorize('admin', 'supervisor'), validate(create), bookingController.create);
router.put('/:id', authorize('admin', 'supervisor'), validate(update), bookingController.update);
router.delete('/:id', authorize('admin', 'supervisor'), bookingController.remove);

module.exports = router;
