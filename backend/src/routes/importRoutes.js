const express = require('express');
const importController = require('../controllers/importController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { uploadExcel } = require('../middlewares/uploadExcel');
const { excel } = require('../validations/importValidation');

const router = express.Router();

router.use(authenticate);

// Import massif : réservé aux administrateurs. Le mode est validé avant de
// recevoir le fichier pour ne pas lire un upload qui serait refusé ensuite.
router.post('/excel', authorize('admin'), validate(excel, 'query'), uploadExcel, importController.excel);

module.exports = router;
