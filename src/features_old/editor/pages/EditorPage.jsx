import React from 'react';

const EditorPage = ({ readOnly = false }) => {
  return (
    <div>
      <h1>Editor Page</h1>
      {readOnly ? <p>Read-only mode enabled.</p> : <p>Edit mode enabled.</p>}
    </div>
  );
};

export default EditorPage;
