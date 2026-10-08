const express = require('express');
const containerController = require('../controllers/containerController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { create, update, list, markProcessed } = require('../validations/containerValidation');
const { idParamSchema } = require('../validations/commonValidation');

const router = express.Router();

router.use(authenticate);

// Enregistrée avant le middleware générique `/:id` ci-dessous : sinon
// "stats" serait intercepté comme une valeur de :id et échouerait la
// validation Joi (qui attend un entier).
router.get('/stats/:id', validate(idParamSchema, 'params'), containerController.statsByBooking);

router.use('/:id', validate(idParamSchema, 'params'));

router.get('/', validate(list, 'query'), containerController.list);
router.get('/:id', containerController.detail);
router.get('/:id/movements', containerController.movements);
router.post('/', authorize('admin', 'supervisor'), validate(create), containerController.create);
router.put('/:id', authorize('admin', 'supervisor'), validate(update), containerController.update);
router.delete('/:id', authorize('admin', 'supervisor'), containerController.remove);
router.post(
  '/:id/mark-processed',
  authorize('admin', 'supervisor'),
  validate(markProcessed),
  containerController.markProcessed
);

module.exports = router;
