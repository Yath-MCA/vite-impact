import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Overlay types supported by the system
 */
export type OverlayType = 'dialog' | 'popout' | 'sidebar';

/**
 * Footer types for overlays
 */
export type FooterType = 'actions' | 'none';

/**
 * Position for popout overlays
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Size for overlays
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Configuration for opening an overlay
 */
export interface OverlayConfig {
  type: OverlayType;
  title: string;
  dropOver?: boolean;
  footerType?: FooterType;
  width?: number;
  height?: number;
  position?: Position;
  props?: Record<string, unknown>;
  onAction?: string;
}

/**
 * Page Object Model for Overlay interactions
 * Provides methods to interact with the overlay system
 */
export class OverlayPage {
  readonly page: Page;
  
  // Selectors
  readonly overlayContainer: Locator;
  readonly overlayBackdrop: Locator;
  readonly overlayDialog: Locator;
  readonly overlayPopout: Locator;
  readonly overlaySidebar: Locator;
  readonly overlayHeader: Locator;
  readonly overlayTitle: Locator;
  readonly minimizeButton: Locator;
  readonly fullscreenButton: Locator;
  readonly closeButton: Locator;
  readonly typeSwitcher: Locator;
  readonly typeMenu: Locator;
  readonly dockContainer: Locator;
  readonly dockItems: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Initialize locators with data-testid attributes
    this.overlayContainer = page.locator('[data-testid="overlay-container"]');
    this.overlayBackdrop = page.locator('[data-testid="overlay-backdrop"]');
    this.overlayDialog = page.locator('[data-testid="overlay-dialog"]');
    this.overlayPopout = page.locator('[data-testid="overlay-popout"]');
    this.overlaySidebar = page.locator('[data-testid="overlay-sidebar"]');
    this.overlayHeader = page.locator('[data-testid="overlay-header"]');
    this.overlayTitle = page.locator('[data-testid="overlay-title"]');
    this.minimizeButton = page.locator('[data-testid="overlay-minimize-btn"]');
    this.fullscreenButton = page.locator('[data-testid="overlay-fullscreen-btn"]');
    this.closeButton = page.locator('[data-testid="overlay-close-btn"]');
    this.typeSwitcher = page.locator('[data-testid="overlay-type-switcher"]');
    this.typeMenu = page.locator('[data-testid="overlay-type-menu"]');
    this.dockContainer = page.locator('[data-testid="dock-container"]');
    this.dockItems = page.locator('[data-testid="dock-item"]');
  }

  /**
   * Navigate to the application
   */
  async goto(path: string = '/') {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Open an overlay using the provided trigger button
   * @param triggerSelector - Selector for the button that opens the overlay
   */
  async openOverlay(triggerSelector: string): Promise<string> {
    await this.page.locator(triggerSelector).click();
    await this.waitForOverlayVisible();
    
    // Get the overlay ID from the DOM
    const overlayId = await this.getCurrentOverlayId();
    return overlayId;
  }

  /**
   * Open an overlay by type using the demo buttons
   */
  async openOverlayByType(type: OverlayType): Promise<string> {
    const buttonMap: Record<OverlayType, string> = {
      dialog: 'button:has-text("Open Dialog")',
      popout: 'button:has-text("Open Popout")',
      sidebar: 'button:has-text("Open Sidebar")'
    };
    
    await this.page.locator(buttonMap[type]).click();
    await this.waitForOverlayVisible();
    
    return this.getCurrentOverlayId();
  }

  /**
   * Open a module from the registry
   */
  async openModuleFromRegistry(moduleName: 'example' | 'settings'): Promise<string> {
    const buttonMap = {
      example: 'button:has-text("Open Example Module")',
      settings: 'button:has-text("Open Settings")'
    };
    
    await this.page.locator(buttonMap[moduleName]).click();
    await this.waitForOverlayVisible();
    
    return this.getCurrentOverlayId();
  }

  /**
   * Switch overlay type at runtime
   */
  async switchType(newType: OverlayType): Promise<void> {
    // Click type switcher to open menu
    await this.typeSwitcher.click();
    await expect(this.typeMenu).toBeVisible();
    
    // Click the desired type option
    const typeOption = this.page.locator(`[data-testid="overlay-type-option-${newType}"]`);
    await typeOption.click();
    
    // Wait for transition
    await this.page.waitForTimeout(300);
  }

  /**
   * Minimize the current overlay
   */
  async minimize(): Promise<void> {
    await this.minimizeButton.first().click();
    await this.waitForOverlayHidden();
  }

  /**
   * Restore a minimized overlay from dock
   */
  async restoreFromDock(overlayTitle?: string): Promise<void> {
    if (overlayTitle) {
      await this.page.locator(`[data-testid="dock-item"]:has-text("${overlayTitle}")`).click();
    } else {
      await this.dockItems.first().click();
    }
    await this.waitForOverlayVisible();
  }

  /**
   * Toggle fullscreen mode
   */
  async toggleFullscreen(): Promise<void> {
    await this.fullscreenButton.first().click();
    await this.page.waitForTimeout(200);
  }

  /**
   * Close the current overlay
   */
  async close(): Promise<void> {
    await this.closeButton.first().click();
    await this.waitForOverlayHidden();
  }

  /**
   * Close overlay by clicking backdrop (for dropOver mode)
   */
  async closeByBackdrop(): Promise<void> {
    await this.overlayBackdrop.click();
    await this.waitForOverlayHidden();
  }

  /**
   * Close overlay using ESC key
   */
  async closeByEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.waitForOverlayHidden();
  }

  /**
   * Check if any overlay is visible
   */
  async isVisible(): Promise<boolean> {
    const count = await this.overlayContainer.count();
    if (count === 0) return false;
    return await this.overlayContainer.first().isVisible();
  }

  /**
   * Check if backdrop is visible
   */
  async isBackdropVisible(): Promise<boolean> {
    const count = await this.overlayBackdrop.count();
    if (count === 0) return false;
    return await this.overlayBackdrop.first().isVisible();
  }

  /**
   * Check if dock is visible
   */
  async isDockVisible(): Promise<boolean> {
    const count = await this.dockContainer.count();
    if (count === 0) return false;
    return await this.dockContainer.isVisible();
  }

  /**
   * Get the current overlay ID
   */
  async getCurrentOverlayId(): Promise<string> {
    const overlay = this.overlayContainer.first();
    return await overlay.getAttribute('data-overlay-id') || '';
  }

  /**
   * Get overlay title text
   */
  async getTitle(): Promise<string> {
    return await this.overlayTitle.first().textContent() || '';
  }

  /**
   * Get the z-index of the top overlay
   */
  async getTopOverlayZIndex(): Promise<number> {
    const overlay = this.overlayContainer.first();
    const zIndex = await overlay.evaluate(el => {
      return parseInt(window.getComputedStyle(el).zIndex) || 0;
    });
    return zIndex;
  }

  /**
   * Get all visible overlays count
   */
  async getVisibleOverlaysCount(): Promise<number> {
    return await this.overlayContainer.count();
  }

  /**
   * Get minimized overlays count from dock
   */
  async getDockItemsCount(): Promise<number> {
    return await this.dockItems.count();
  }

  /**
   * Wait for overlay to become visible
   */
  async waitForOverlayVisible(): Promise<void> {
    await expect(this.overlayContainer.first()).toBeVisible();
  }

  /**
   * Wait for overlay to be hidden/removed
   */
  async waitForOverlayHidden(): Promise<void> {
    await expect(this.overlayContainer.first()).not.toBeVisible();
  }

  /**
   * Get overlay dimensions
   */
  async getOverlayDimensions(): Promise<{ width: number; height: number }> {
    const overlay = this.overlayContainer.first();
    const box = await overlay.boundingBox();
    return {
      width: box?.width || 0,
      height: box?.height || 0
    };
  }

  /**
   * Check if body scroll is locked
   */
  async isBodyScrollLocked(): Promise<boolean> {
    const overflow = await this.page.evaluate(() => {
      return document.body.style.overflow;
    });
    return overflow === 'hidden';
  }

  /**
   * Get all header action buttons
   */
  async getHeaderActions(): Promise<Locator> {
    return this.page.locator('[data-testid="overlay-header"] button');
  }

  /**
   * Check if overlay is in fullscreen mode
   */
  async isFullscreen(): Promise<boolean> {
    const overlay = this.overlayContainer.first();
    const isFullscreen = await overlay.evaluate(el => {
      return el.getAttribute('data-fullscreen') === 'true';
    });
    return isFullscreen;
  }

  /**
   * Focus on an overlay by clicking it
   */
  async focusOverlay(overlayId?: string): Promise<void> {
    if (overlayId) {
      await this.page.locator(`[data-overlay-id="${overlayId}"]`).click();
    } else {
      await this.overlayContainer.first().click();
    }
  }

  /**
   * Get content from within the overlay
   */
  getOverlayContent(): Locator {
    return this.page.locator('[data-testid="overlay-content"]');
  }

  /**
   * Verify overlay type
   */
  async getOverlayType(): Promise<OverlayType | null> {
    const container = this.overlayContainer.first();
    const typeAttr = await container.getAttribute('data-overlay-type');
    return typeAttr as OverlayType || null;
  }

  /**
   * Press keyboard key
   */
  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  /**
   * Tab through focusable elements
   */
  async tab(times: number = 1): Promise<void> {
    for (let i = 0; i < times; i++) {
      await this.page.keyboard.press('Tab');
    }
  }

  /**
   * Get currently focused element
   */
  async getFocusedElement(): Promise<Locator> {
    return this.page.locator(':focus');
  }
}
