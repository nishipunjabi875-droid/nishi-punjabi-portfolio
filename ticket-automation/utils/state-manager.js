const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class StateManager {
  constructor(filePath = config.stateFilePath) {
    this.filePath = filePath;
    this.ensureDirectory();
    this.state = this.loadState();
  }

  ensureDirectory() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  loadState() {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('⚠️ Could not parse existing state file. Creating new state.', err.message);
      }
    }
    return {
      startTime: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      discoveredMatrix: [],
      results: {}
    };
  }

  saveState() {
    try {
      this.state.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2), 'utf8');
    } catch (err) {
      console.error('⚠️ Failed to save execution state:', err.message);
    }
  }

  setDiscoveredMatrix(matrix) {
    this.state.discoveredMatrix = matrix;
    this.saveState();
  }

  isCombinationPassed(l1, l2) {
    const key = `${l1}|${l2}`;
    const entry = this.state.results[key];
    return entry && entry.status === 'PASS';
  }

  getCombinationResult(l1, l2) {
    const key = `${l1}|${l2}`;
    return this.state.results[key] || null;
  }

  recordResult(l1, l2, resultData) {
    const key = `${l1}|${l2}`;
    this.state.results[key] = {
      l1,
      l2,
      ...resultData,
      updatedAt: new Date().toISOString()
    };
    this.saveState();
  }

  getAllResults() {
    return Object.values(this.state.results);
  }

  clearState() {
    this.state = {
      startTime: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      discoveredMatrix: [],
      results: {}
    };
    if (fs.existsSync(this.filePath)) {
      try {
        fs.unlinkSync(this.filePath);
      } catch (e) {}
    }
  }
}

module.exports = StateManager;
