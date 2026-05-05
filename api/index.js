const { getApp } = require('../server/app');

let handler = null;

module.exports = async (req, res) => {
  if (!handler) {
    handler = await getApp();
  }
  return handler(req, res);
};
