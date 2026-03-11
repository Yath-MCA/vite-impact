/**
 * Plugin Integration Demo Component
 * Shows usage of all integrated libraries
 */

import React, { useState, useRef } from 'react';
import { renderTemplate } from '../plugins/mustache';
import { formatDate, fromNow } from '../plugins/moment';
import { get, post } from '../plugins/axios';
import { success, error, confirm, toast } from '../plugins/sweetalert';
import GridWrapper from '../plugins/aggrid/GridWrapper';
import SummernoteEditor from '../plugins/summernote/SummernoteEditor';
import DateTimePicker from '../plugins/tempusdominus/DateTimePicker';
import '../styles/fonts';

// Sample data for Mustache template
const templateString = `
  <div class="user-card">
    <h3>{{name}}</h3>
    <p>Email: {{email}}</p>
    <p>Role: {{role}}</p>
    <p>Joined: {{joinDate}}</p>
  </div>
`;

const templateData = {
  name: 'John Doe',
  email: 'john@example.com',
  role: 'Administrator',
  joinDate: formatDate(new Date(), 'display')
};

// Sample data for AG Grid
const gridData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', created: formatDate(new Date()), status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', created: formatDate(new Date()), status: 'Active' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Editor', created: formatDate(new Date()), status: 'Inactive' }
];

const columnDefs = [
  { field: 'id', headerName: 'ID', width: 80 },
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'email', headerName: 'Email', flex: 1.5 },
  { field: 'role', headerName: 'Role', width: 120 },
  { field: 'created', headerName: 'Created', width: 150 },
  { field: 'status', headerName: 'Status', width: 100 }
];

export default function PluginDemo() {
  const [editorContent, setEditorContent] = useState('<p>Initial content...</p>');
  const [selectedDate, setSelectedDate] = useState('');
  const [templateOutput, setTemplateOutput] = useState('');
  const [apiResponse, setApiResponse] = useState(null);
  const gridRef = useRef(null);

  // Mustache demo
  const handleRenderTemplate = () => {
    const rendered = renderTemplate(templateString, templateData);
    setTemplateOutput(rendered);
    toast('Template rendered successfully!');
  };

  // Moment demo
  const now = new Date();
  const formattedDate = formatDate(now, 'display');
  const relativeTime = fromNow(now);

  // Axios demo
  const handleApiCall = async () => {
    try {
      toast('Making API call...', 'info');
      // This is a demo - replace with actual endpoint
      // const response = await get('/api/users');
      setApiResponse({ status: 'success', message: 'API call simulated' });
      success('API call successful!');
    } catch (err) {
      error('API call failed', err.message);
    }
  };

  // SweetAlert2 demos
  const handleShowSuccess = () => success('Operation completed!');
  const handleShowError = () => error('Something went wrong', 'Please try again later');
  const handleShowConfirm = async () => {
    const confirmed = await confirm('Are you sure?', 'This action cannot be undone');
    if (confirmed) {
      success('Confirmed!');
    }
  };

  // Grid demo
  const handleRowClick = (data) => {
    toast(`Selected: ${data.name}`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <h1 className="text-4xl font-bold text-center mb-8">Plugin Integration Demo</h1>

      {/* Mustache Template Section */}
      <section className="border rounded-xl p-6 bg-white shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">1. Mustache Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Template:</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">{templateString}</pre>
          </div>
          <div>
            <h3 className="font-medium mb-2">Rendered Output:</h3>
            <div 
              className="bg-gray-50 p-3 rounded border"
              dangerouslySetInnerHTML={{ __html: templateOutput }}
            />
            <button
              onClick={handleRenderTemplate}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Render Template
            </button>
          </div>
        </div>
      </section>

      {/* Moment.js Section */}
      <section className="border rounded-xl p-6 bg-white shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">2. Moment.js Dates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">Formatted Date:</p>
            <p className="text-lg font-medium">{formattedDate}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">Relative Time:</p>
            <p className="text-lg font-medium">{relativeTime}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">ISO Format:</p>
            <p className="text-sm font-mono">{now.toISOString()}</p>
          </div>
        </div>
      </section>

      {/* Axios Section */}
      <section className="border rounded-xl p-6 bg-white shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">3. Axios HTTP Client</h2>
        <div className="space-y-4">
          <button
            onClick={handleApiCall}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Make API Call
          </button>
          {apiResponse && (
            <pre className="bg-gray-100 p-3 rounded text-sm">{JSON.stringify(apiResponse, null, 2)}</pre>
          )}
        </div>
      </section>

      {/* SweetAlert2 Section */}
      <section className="border rounded-xl p-6 bg-white shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">4. SweetAlert2 Alerts</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleShowSuccess} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Show Success
          </button>
          <button onClick={handleShowError} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Show Error
          </button>
          <button onClick={handleShowConfirm} className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
            Show Confirm
          </button>
        </div>
      </section>

      {/* AG Grid Section */}
      <section className="border rounded-xl p-6 bg-white shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">5. AG Grid</h2>
        <div style={{ height: '300px' }} className="w-full">
          <GridWrapper
            ref={gridRef}
            rowData={gridData}
            columnDefs={columnDefs}
            onRowClick={handleRowClick}
            pagination={true}
            paginationPageSize={10}
          />
        </div>
      </section>

      {/* Summernote Section */}
      <section className="border rounded-xl p-6 bg-white shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">6. Summernote Editor</h2>
        <SummernoteEditor
          value={editorContent}
          onChange={setEditorContent}
          placeholder="Enter your content here..."
          height={200}
        />
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600 mb-1">HTML Output:</p>
          <code className="text-xs block break-all">{editorContent}</code>
        </div>
      </section>

      {/* Tempus Dominus Section */}
      <section className="border rounded-xl p-6 bg-white shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">7. Tempus Dominus DateTime Picker</h2>
        <div className="max-w-md">
          <DateTimePicker
            value={selectedDate}
            onChange={(formatted, date) => setSelectedDate(formatted)}
            placeholder="Select date and time"
          />
          {selectedDate && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: <strong>{selectedDate}</strong>
            </p>
          )}
        </div>
      </section>

      {/* Font Section */}
      <section className="border rounded-xl p-6 bg-white shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">8. Source Sans Pro Font</h2>
        <div className="space-y-2">
          <p className="font-light text-2xl">Source Sans Pro Light (300)</p>
          <p className="font-normal text-2xl">Source Sans Pro Regular (400)</p>
          <p className="font-semibold text-2xl">Source Sans Pro Semibold (600)</p>
          <p className="font-bold text-2xl">Source Sans Pro Bold (700)</p>
        </div>
      </section>
    </div>
  );
}
