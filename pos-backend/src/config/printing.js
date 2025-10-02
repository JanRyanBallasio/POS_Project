module.exports = {
    development: {
      backend: 'http://localhost:5000',
      defaultPrinter: {
        type: 'local',
        name: 'Default Local Printer'
      }
    },
    production: {
      backend: 'http://3.107.238.186:5000',
      defaultPrinter: {
        type: 'local',
        name: 'Default Production Printer'
      }
    }
  };