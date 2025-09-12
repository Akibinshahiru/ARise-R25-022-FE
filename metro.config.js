// Ensure Metro treats .glb and .gltf as assets so they can be required()
// Works with Expo SDK 53 managed workflow.
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);
  const { assetExts } = config.resolver;
  config.resolver.assetExts = [...new Set([...assetExts, 'glb', 'gltf', 'txt'])];
  return config;
})();
