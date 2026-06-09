const express = require('express');
const router = express.Router();
const { getInventory, updateInventoryItem } = require('../controllers/inventoryController');
const { auth, admin } = require('../middleware/auth');

router.get('/', auth, getInventory);
router.put('/:id', auth, admin, updateInventoryItem);

module.exports = router;
