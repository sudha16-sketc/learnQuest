const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [...new Set([...(config.watchFolders || []), monorepoRoot])];

config.resolver.nodeModulesPaths = [
  ...new Set([
    ...(config.resolver.nodeModulesPaths || []),
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(monorepoRoot, 'node_modules'),
  ]),
];

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@learnquest/shared': path.resolve(monorepoRoot, 'packages', 'shared'),
  '@learnquest/game-core': path.resolve(monorepoRoot, 'packages', 'game-core'),
  '@learnquest/contracts-client': path.resolve(monorepoRoot, 'packages', 'contracts-client'),
  '@learnquest/validation': path.resolve(monorepoRoot, 'packages', 'validation'),
};

module.exports = config;
