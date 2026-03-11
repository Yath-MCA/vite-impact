/**
 * Summernote WYSIWYG Editor Wrapper
 * React wrapper for jQuery Summernote plugin
 */

import React, { useEffect, useRef, useCallback } from 'react';
import $ from 'jquery';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'summernote/dist/summernote-bs4.css';
import 'summernote/dist/summernote-bs4.min.js';

const SummernoteEditor = ({
  value = '',
  onChange,
  onBlur,
  onFocus,
  onImageUpload,
  placeholder = 'Enter content here...',
  height = 300,
  minHeight = 200,
  maxHeight = 600,
  focus = false,
  toolbar = [
    ['style', ['style']],
    ['font', ['bold', 'underline', 'clear']],
    ['fontname', ['fontname']],
    ['color', ['color']],
    ['para', ['ul', 'ol', 'paragraph']],
    ['table', ['table']],
    ['insert', ['link', 'picture', 'video']],
    ['view', ['fullscreen', 'codeview', 'help']]
  ],
  className = '',
  disabled = false
}) => {
  const editorRef = useRef(null);
  const summernoteRef = useRef(null);
  const isInitialized = useRef(false);

  // Initialize Summernote
  useEffect(() => {
    if (!editorRef.current || isInitialized.current) return;

    try {
      const $editor = $(editorRef.current);
      
      $editor.summernote({
        placeholder,
        tabsize: 2,
        height,
        minHeight,
        maxHeight,
        focus,
        toolbar,
        callbacks: {
          onChange: (contents) => {
            onChange?.(contents);
          },
          onBlur: () => {
            onBlur?.();
          },
          onFocus: () => {
            onFocus?.();
          },
          onImageUpload: (files) => {
            onImageUpload?.(files);
          }
        }
      });

      summernoteRef.current = $editor;
      isInitialized.current = true;

      // Set initial value
      if (value) {
        $editor.summernote('code', value);
      }
    } catch (error) {
      console.error('[Summernote] Initialization error:', error);
    }

    // Cleanup on unmount
    return () => {
      try {
        if (summernoteRef.current && isInitialized.current) {
          summernoteRef.current.summernote('destroy');
          isInitialized.current = false;
          summernoteRef.current = null;
        }
      } catch (error) {
        console.error('[Summernote] Cleanup error:', error);
      }
    };
  }, []); // Empty deps - initialize once

  // Update value when prop changes
  useEffect(() => {
    if (isInitialized.current && summernoteRef.current) {
      const currentCode = summernoteRef.current.summernote('code');
      if (currentCode !== value) {
        summernoteRef.current.summernote('code', value);
      }
    }
  }, [value]);

  // Handle disabled state
  useEffect(() => {
    if (isInitialized.current && summernoteRef.current) {
      if (disabled) {
        summernoteRef.current.summernote('disable');
      } else {
        summernoteRef.current.summernote('enable');
      }
    }
  }, [disabled]);

  // Get content method
  const getContent = useCallback(() => {
    if (isInitialized.current && summernoteRef.current) {
      return summernoteRef.current.summernote('code');
    }
    return '';
  }, []);

  // Set content method
  const setContent = useCallback((content) => {
    if (isInitialized.current && summernoteRef.current) {
      summernoteRef.current.summernote('code', content);
    }
  }, []);

  // Insert text method
  const insertText = useCallback((text) => {
    if (isInitialized.current && summernoteRef.current) {
      summernoteRef.current.summernote('editor.insertText', text);
    }
  }, []);

  // Insert HTML method
  const insertHtml = useCallback((html) => {
    if (isInitialized.current && summernoteRef.current) {
      summernoteRef.current.summernote('pasteHTML', html);
    }
  }, []);

  // Expose methods via ref if needed
  React.useImperativeHandle(
    React.useRef(),
    () => ({
      getContent,
      setContent,
      insertText,
      insertHtml
    }),
    [getContent, setContent, insertText, insertHtml]
  );

  return (
    <div className={`summernote-wrapper ${className}`}>
      <textarea ref={editorRef} className="summernote-editor" />
    </div>
  );
};

export default SummernoteEditor;
