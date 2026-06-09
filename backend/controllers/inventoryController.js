const dbService = require('../models/dbService');
const { sendEmail } = require('../config/mailer');

// Check stock levels and notify admin if below threshold
const checkStockAndNotify = async () => {
  try {
    const inventory = await dbService.Inventory.find({});
    const lowStockItems = inventory.filter(item => item.quantity < item.threshold);

    if (lowStockItems.length > 0) {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@pizzadelivery.com';
      const itemsList = lowStockItems.map(item => `- ${item.name} (${item.category}): Current stock is ${item.quantity} (Threshold: ${item.threshold})`).join('\n');

      const text = `Warning: The following pizza ingredients are running low on stock:\n\n${itemsList}\n\nPlease restock immediately.`;
      const html = `<h2>⚠️ Low Stock Alert</h2><p>The following pizza ingredients are running low on stock:</p><ul>${lowStockItems.map(item => `<li><strong>${item.name}</strong> (${item.category}): Current stock is <strong>${item.quantity}</strong> (Threshold: ${item.threshold})</li>`).join('')}</ul><p>Please log in to the admin panel to restock these items.</p>`;

      await sendEmail({
        to: adminEmail,
        subject: '⚠️ LOW STOCK ALERT - Pizza Delivery System',
        text,
        html
      });
      return lowStockItems;
    }
  } catch (error) {
    console.error('Error during stock check notification:', error);
  }
  return [];
};

const getInventory = async (req, res) => {
  try {
    const items = await dbService.Inventory.find({});
    res.status(200).json(items);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ message: 'Server error retrieving inventory.' });
  }
};

const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, threshold } = req.body;

    if (quantity === undefined && threshold === undefined) {
      return res.status(400).json({ message: 'Please provide quantity or threshold to update.' });
    }

    const updates = {};
    if (quantity !== undefined) updates.quantity = Number(quantity);
    if (threshold !== undefined) updates.threshold = Number(threshold);

    const queryKey = global.dbFallback ? 'id' : '_id';
    const updatedItem = await dbService.Inventory.findOneAndUpdate({ [queryKey]: id }, updates);

    if (!updatedItem) {
      return res.status(404).json({ message: 'Inventory item not found.' });
    }

    // Proactively check stock levels and notify if an update left items low, or just as a general check
    await checkStockAndNotify();

    res.status(200).json({ message: 'Inventory item updated successfully.', item: updatedItem });
  } catch (error) {
    console.error('Update inventory item error:', error);
    res.status(500).json({ message: 'Server error updating inventory item.' });
  }
};

module.exports = {
  getInventory,
  updateInventoryItem,
  checkStockAndNotify,
};
