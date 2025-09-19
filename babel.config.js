module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/hooks': './src/hooks',
            '@/utils': './src/utils',
            '@/types': './src/types',
            '@/store': './src/store'
          },
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
        }
      ],
      // React Native Reanimated plugin must be last
      'react-native-reanimated/plugin'
    ]
  };
};