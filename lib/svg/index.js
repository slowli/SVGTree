module.exports = {
  marker: require('./marker'),
  edge: require('./edge'),
  label: require('./label'),
  body: require('./body'),

  getRenderer (name, options) {
    if (typeof options === 'function') {
      // A readymade factory is passed, no need to process
      return options;
    }

    if (!options) {
      return () => null;
    }

    var renderer = this[name];
    return renderer.with(options);
  },

  explicitOptions (options) {
    var names = options._explicit;
    var explicit = {};
    for (var name in options) {
      if (names.indexOf(name) >= 0) {
        explicit[name] = options[name];
      }
    }
    return explicit;
  }
};
