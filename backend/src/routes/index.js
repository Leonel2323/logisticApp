const express = require('express');

const authRoutes = require('./authRoutes');
const clientRoutes = require('./clientRoutes');
const vehicleRoutes = require('./vehicleRoutes');
const driverRoutes = require('./driverRoutes');
const containerRoutes = require('./containerRoutes');
const bookingRoutes = require('./bookingRoutes');
const fuelRoutes = require('./fuelRoutes');
const containerMovementRoutes = require('./containerMovementRoutes');
const saleRoutes = require('./saleRoutes');
const cashTransactionRoutes = require('./cashTransactionRoutes');
const expenseRoutes = require('./expenseRoutes');
const chartOfAccountRoutes = require('./chartOfAccountRoutes');
const chatEmbeddingRoutes = require('./chatEmbeddingRoutes');

const router = express.Router();

router.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));

router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/drivers', driverRoutes);
router.use('/containers', containerRoutes);
router.use('/bookings', bookingRoutes);
router.use('/fuel', fuelRoutes);
router.use('/container-movements', containerMovementRoutes);
router.use('/sales', saleRoutes);
router.use('/cash-transactions', cashTransactionRoutes);
router.use('/expenses', expenseRoutes);
router.use('/chart-of-accounts', chartOfAccountRoutes);
router.use('/chat-embeddings', chatEmbeddingRoutes);

module.exports = router;
