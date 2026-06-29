const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../mock-db.json');

let getInitialDataFn = null;

const setInitialDataGenerator = (fn) => {
  getInitialDataFn = fn;
};

const readDB = () => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const data = getInitialDataFn ? getInitialDataFn() : {};
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
      return data;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    if (!raw.trim()) {
      const data = getInitialDataFn ? getInitialDataFn() : {};
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
      return data;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading DB:', error);
    return getInitialDataFn ? getInitialDataFn() : {};
  }
};

const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing DB:', error);
    return false;
  }
};

module.exports = {
  readDB,
  writeDB,
  setInitialDataGenerator,
  DB_PATH
};
