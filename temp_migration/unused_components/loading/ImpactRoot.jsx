import React from 'react';
import AppInitializer from './AppInitializer';

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
