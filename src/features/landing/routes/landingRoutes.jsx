import React from 'react';

/**
 * Landing feature route table (kept for feature-MVC discovery).
 * AppRouter currently lazy-loads ValidateUrlPage directly to preserve code-splitting.
 */
export const landingRoutePaths = ['/', '/validateurl', '/validateurl/:client'];

export { default as ValidateUrlPage } from '../pages/ValidateUrlPage.jsx';
export const loadLandingUI = () => import('../pages/LandingUI.jsx');
