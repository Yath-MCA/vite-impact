import React from 'react';
import AppInitializer from './AppInitializer';

/**
 * ImpactRoot Component
 * Root component that wraps the application
 * Can be used to provide context or wrap child components
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {Function} props.onInitialized - Initialization callback
 * @param {Function} props.onError - Error callback
 */
const ImpactRoot = ({ children, onInitialized, onError }) => {
  return (
    <>
      <AppInitializer 
        onInitialized={onInitialized}
        onError={onError}
        autoStart={true}
      />
      {children}
    </>
  );
};

export default ImpactRoot;
