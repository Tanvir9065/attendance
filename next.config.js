module.exports = { webpack: (c) => { c.resolve.fallback = { ...c.resolve.fallback, fs: false, path: false, os: false }; return c; } };
