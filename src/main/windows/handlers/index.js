/**
 * Window Event Handlers
 *
 * This file imports all custom event handlers for different window types
 * to ensure they are properly registered with the WindowEventHandler.
 */

import MainWindowEventHandler from './MainWindowEventHandler.js';
import FacePanelEventHandler from './FacePanelEventHandler.js';
import SettingsWindowEventHandler from './SettingsWindowEventHandler.js';

// Export all handlers for direct access if needed
export {
  MainWindowEventHandler,
  FacePanelEventHandler,
  SettingsWindowEventHandler
};

// Default export as a combined object
export default {
  MainWindowEventHandler,
  FacePanelEventHandler,
  SettingsWindowEventHandler
};
