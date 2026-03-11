/**
 * Tempus Dominus DateTime Picker Wrapper
 * React wrapper for jQuery Tempus Dominus plugin
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import $ from 'jquery';
import moment from 'moment';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'tempusdominus-bootstrap-4/build/css/tempusdominus-bootstrap-4.min.css';
import 'tempusdominus-bootstrap-4/build/js/tempusdominus-bootstrap-4.min.js';

const DateTimePicker = ({
  value,
  onChange,
  onShow,
  onHide,
  placeholder = 'Select date and time',
  format = 'YYYY-MM-DD HH:mm:ss',
  minDate,
  maxDate,
  disabled = false,
  readOnly = false,
  className = '',
  inputClassName = '',
  icon = true,
  sideBySide = true,
  showClear = true,
  showClose = true,
  showToday = true
}) => {
  const inputRef = useRef(null);
  const pickerRef = useRef(null);
  const isInitialized = useRef(false);
  const [displayValue, setDisplayValue] = useState('');

  // Initialize picker
  useEffect(() => {
    if (!inputRef.current || isInitialized.current) return;

    try {
      const $input = $(inputRef.current);
      
      $input.datetimepicker({
        format,
        sideBySide,
        showClear,
        showClose,
        showTodayButton: showToday,
        useCurrent: false,
        icons: {
          time: 'fa fa-clock-o',
          date: 'fa fa-calendar',
          up: 'fa fa-chevron-up',
          down: 'fa fa-chevron-down',
          previous: 'fa fa-chevron-left',
          next: 'fa fa-chevron-right',
          today: 'fa fa-calendar-check-o',
          clear: 'fa fa-trash',
          close: 'fa fa-times'
        },
        minDate: minDate ? moment(minDate).toDate() : false,
        maxDate: maxDate ? moment(maxDate).toDate() : false
      });

      // Event handlers
      $input.on('change.datetimepicker', (e) => {
        const date = e.date;
        if (date) {
          const formatted = moment(date).format(format);
          onChange?.(formatted, date.toDate());
          setDisplayValue(formatted);
        } else {
          onChange?.(null, null);
          setDisplayValue('');
        }
      });

      $input.on('show.datetimepicker', () => {
        onShow?.();
      });

      $input.on('hide.datetimepicker', () => {
        onHide?.();
      });

      pickerRef.current = $input;
      isInitialized.current = true;

      // Set initial value
      if (value) {
        const momentDate = moment(value, format);
        if (momentDate.isValid()) {
          $input.datetimepicker('date', momentDate.toDate());
          setDisplayValue(value);
        }
      }
    } catch (error) {
      console.error('[TempusDominus] Initialization error:', error);
    }

    // Cleanup
    return () => {
      try {
        if (pickerRef.current && isInitialized.current) {
          pickerRef.current.datetimepicker('destroy');
          pickerRef.current.off('change.datetimepicker show.datetimepicker hide.datetimepicker');
          isInitialized.current = false;
          pickerRef.current = null;
        }
      } catch (error) {
        console.error('[TempusDominus] Cleanup error:', error);
      }
    };
  }, []); // Initialize once

  // Update value when prop changes
  useEffect(() => {
    if (isInitialized.current && pickerRef.current) {
      if (value) {
        const momentDate = moment(value, format);
        if (momentDate.isValid()) {
          const currentDate = pickerRef.current.datetimepicker('date');
          if (!currentDate || !moment(currentDate).isSame(momentDate)) {
            pickerRef.current.datetimepicker('date', momentDate.toDate());
            setDisplayValue(value);
          }
        }
      } else {
        pickerRef.current.datetimepicker('clear');
        setDisplayValue('');
      }
    }
  }, [value, format]);

  // Handle disabled state
  useEffect(() => {
    if (isInitialized.current && pickerRef.current) {
      if (disabled) {
        pickerRef.current.prop('disabled', true);
      } else {
        pickerRef.current.prop('disabled', false);
      }
    }
  }, [disabled]);

  // Clear picker
  const clear = useCallback(() => {
    if (isInitialized.current && pickerRef.current) {
      pickerRef.current.datetimepicker('clear');
    }
  }, []);

  // Show picker
  const show = useCallback(() => {
    if (isInitialized.current && pickerRef.current) {
      pickerRef.current.datetimepicker('show');
    }
  }, []);

  // Hide picker
  const hide = useCallback(() => {
    if (isInitialized.current && pickerRef.current) {
      pickerRef.current.datetimepicker('hide');
    }
  }, []);

  // Toggle picker
  const toggle = useCallback(() => {
    if (isInitialized.current && pickerRef.current) {
      pickerRef.current.datetimepicker('toggle');
    }
  }, []);

  return (
    <div className={`datetimepicker-wrapper ${className}`}>
      <div className="input-group date" id="datetimepicker1" data-target-input="nearest">
        <input
          ref={inputRef}
          type="text"
          className={`form-control datetimepicker-input ${inputClassName}`}
          placeholder={placeholder}
          readOnly={readOnly}
          disabled={disabled}
          value={displayValue}
          onChange={() => {}} // Controlled component
          data-target="#datetimepicker1"
        />
        {icon && (
          <div className="input-group-append" data-target="#datetimepicker1" data-toggle="datetimepicker">
            <div className="input-group-text bg-gray-100 border-l-0 cursor-pointer">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DateTimePicker;
