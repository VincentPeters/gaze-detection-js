/**
 * Build configuration loader
 * Loads platform-specific configurations based on the target platform
 */
import windowsConfig from './windows.js';


/**
 * Get platform-specific configuration
 * @param {string} platform - Target platform (win32, darwin, linux)
 * @returns {Object} Platform-specific configuration
 */
function getPlatformConfig(platform) {
  switch (platform) {
    case 'win32':
      return windowsConfig;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Merge base configuration with platform-specific configuration
 * @param {Object} baseConfig - Base configuration
 * @param {string} platform - Target platform
 * @returns {Object} Merged configuration
 */
function mergeWithPlatformConfig(baseConfig, platform) {
  const platformConfig = getPlatformConfig(platform);

  // Deep merge the configurations
  return {
    ...baseConfig,
    packagerConfig: {
      ...baseConfig.packagerConfig,
      ...platformConfig.packagerConfig,
    },
    // Handle makers differently based on platform
    makers: platform === 'linux'
      ? platformConfig.makerConfigs
      : baseConfig.makers.map(maker => {
          // Find matching maker in platform config
          if (maker.name === platformConfig.makerConfig?.name) {
            return {
              ...maker,
              config: {
                ...maker.config,
                ...platformConfig.makerConfig.config,
              },
            };
          }
          return maker;
        }),
    hooks: {
      ...baseConfig.hooks,
      ...platformConfig.hooks,
    },
  };
}

export { getPlatformConfig, mergeWithPlatformConfig };
