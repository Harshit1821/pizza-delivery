const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

const getFilePath = (collection) => path.join(DATA_DIR, `${collection}.json`);

const readData = (collection) => {
  const file = getFilePath(collection);
  if (!fs.existsSync(file)) {
    // If it's inventory and empty, initialize default data
    if (collection === 'inventory') {
      const defaultInventory = [
        // Bases
        { id: 'b1', name: 'Thin Crust', category: 'base', quantity: 50, threshold: 20 },
        { id: 'b2', name: 'Cheese Burst', category: 'base', quantity: 50, threshold: 20 },
        { id: 'b3', name: 'Wheat Crust', category: 'base', quantity: 50, threshold: 20 },
        { id: 'b4', name: 'Gluten-free', category: 'base', quantity: 50, threshold: 20 },
        { id: 'b5', name: 'Classic Pan', category: 'base', quantity: 50, threshold: 20 },
        // Sauces
        { id: 's1', name: 'Marinara', category: 'sauce', quantity: 50, threshold: 20 },
        { id: 's2', name: 'Spicy Schezwan', category: 'sauce', quantity: 50, threshold: 20 },
        { id: 's3', name: 'Creamy Alfredo', category: 'sauce', quantity: 50, threshold: 20 },
        { id: 's4', name: 'Pesto', category: 'sauce', quantity: 50, threshold: 20 },
        { id: 's5', name: 'BBQ', category: 'sauce', quantity: 50, threshold: 20 },
        // Cheeses
        { id: 'c1', name: 'Mozzarella', category: 'cheese', quantity: 50, threshold: 15 },
        { id: 'c2', name: 'Cheddar', category: 'cheese', quantity: 50, threshold: 15 },
        { id: 'c3', name: 'Parmesan', category: 'cheese', quantity: 50, threshold: 15 },
        { id: 'c4', name: 'Blue Cheese', category: 'cheese', quantity: 50, threshold: 15 },
        { id: 'c5', name: 'Feta', category: 'cheese', quantity: 50, threshold: 15 },
        // Veggies
        { id: 'v1', name: 'Onions', category: 'veggie', quantity: 80, threshold: 25 },
        { id: 'v2', name: 'Bell Peppers', category: 'veggie', quantity: 80, threshold: 25 },
        { id: 'v3', name: 'Mushrooms', category: 'veggie', quantity: 80, threshold: 25 },
        { id: 'v4', name: 'Olives', category: 'veggie', quantity: 80, threshold: 25 },
        { id: 'v5', name: 'Jalapenos', category: 'veggie', quantity: 80, threshold: 25 },
        { id: 'v6', name: 'Sweet Corn', category: 'veggie', quantity: 80, threshold: 25 },
        { id: 'v7', name: 'Tomatoes', category: 'veggie', quantity: 80, threshold: 25 },
        // Meats
        { id: 'm1', name: 'Pepperoni', category: 'meat', quantity: 40, threshold: 15 },
        { id: 'm2', name: 'Grilled Chicken', category: 'meat', quantity: 40, threshold: 15 },
        { id: 'm3', name: 'Smoked Ham', category: 'meat', quantity: 40, threshold: 15 },
        { id: 'm4', name: 'Sausage', category: 'meat', quantity: 40, threshold: 15 }
      ];
      writeData(collection, defaultInventory);
      return defaultInventory;
    }
    return [];
  }
  try {
    const data = fs.readFileSync(file, 'utf8');
    return JSON.parse(data || '[]');
  } catch (e) {
    return [];
  }
};

const writeData = (collection, data) => {
  const file = getFilePath(collection);
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
};

const generateId = () => Math.random().toString(36).substr(2, 9);

const MockDb = {
  find: (collection, query = {}) => {
    const items = readData(collection);
    return items.filter(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  },

  findOne: (collection, query = {}) => {
    const items = readData(collection);
    return items.find(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    }) || null;
  },

  create: (collection, doc) => {
    const items = readData(collection);
    const newDoc = { id: generateId(), ...doc, createdAt: new Date().toISOString() };
    items.push(newDoc);
    writeData(collection, items);
    return newDoc;
  },

  updateMany: (collection, query, updateFields) => {
    const items = readData(collection);
    let updatedCount = 0;
    const newItems = items.map(item => {
      let matches = true;
      for (let key in query) {
        if (item[key] !== query[key]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        updatedCount++;
        return { ...item, ...updateFields };
      }
      return item;
    });
    writeData(collection, newItems);
    return updatedCount;
  },

  findOneAndUpdate: (collection, query, updateFields) => {
    const items = readData(collection);
    const index = items.findIndex(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
    if (index === -1) return null;
    items[index] = { ...items[index], ...updateFields };
    writeData(collection, items);
    return items[index];
  },

  findByIdAndUpdate: (collection, id, updateFields) => {
    return MockDb.findOneAndUpdate(collection, { id }, updateFields);
  }
};

module.exports = MockDb;
