const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure resolver for better module resolution
config.resolver.sourceExts.push('ts', 'tsx', 'js', 'jsx', 'json');
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Ensure path resolution works correctly
config.resolver.alias = {
  '@': './src',
  '@/components': './src/components',
  '@/hooks': './src/hooks',
  '@/utils': './src/utils',
  '@/types': './src/types',
  '@/store': './src/store'
};

// Transformer configuration for better performance
config.transformer.minifierPath = 'metro-minify-terser';
config.transformer.minifierConfig = {
  ecma: 8,
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Reset cache configuration for EAS builds
config.resetCache = true;

module.exports = config;