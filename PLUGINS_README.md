# Plugin Integration Architecture

Production-ready integration for 8 third-party libraries in React 18 + Vite.

## Libraries Integrated

1. **Mustache** - Template engine with XSS protection
2. **Moment.js** - Date/time handling with timezone support
3. **jQuery** - Scoped usage for legacy plugins only
4. **SweetAlert2** - Beautiful alert dialogs
5. **Axios** - HTTP client with interceptors
6. **AG Grid** - Enterprise data grid
7. **Summernote** - WYSIWYG editor (jQuery-based)
8. **Tempus Dominus** - DateTime picker (jQuery-based)

## Installation

All dependencies are npm-based:

```bash
npm install mustache moment jquery axios sweetalert2 sweetalert2-react-content ag-grid-community ag-grid-react bootstrap summernote tempusdominus-bootstrap-4 @fontsource/source-sans-pro popper.js
```

## Usage Examples

### Mustache Templates

```jsx
import { renderTemplate } from './plugins/mustache';

const template = '<h1>{{name}}</h1>';
const data = { name: 'John' };
const html = renderTemplate(template, data);
```

### Moment.js Dates

```jsx
import { formatDate, fromNow } from './plugins/moment';

const formatted = formatDate(new Date(), 'display');
const relative = fromNow(new Date());
```

### Axios HTTP

```jsx
import { get, post, setAuthToken } from './plugins/axios';

const response = await get('/api/users');
await post('/api/users', { name: 'John' });
```

### SweetAlert2 Alerts

```jsx
import { success, error, confirm } from './plugins/sweetalert';

success('Operation completed!');
error('Something went wrong');
const confirmed = await confirm('Are you sure?');
```

### AG Grid

```jsx
import { GridWrapper } from './plugins';

<GridWrapper
  rowData={data}
  columnDefs={columns}
  pagination={true}
  onRowClick={handleRowClick}
/>
```

### Summernote Editor

```jsx
import { SummernoteEditor } from './plugins';

<SummernoteEditor
  value={content}
  onChange={setContent}
  height={300}
/>
```

### DateTime Picker

```jsx
import { DateTimePicker } from './plugins';

<DateTimePicker
  value={date}
  onChange={(formatted, date) => setDate(formatted)}
  placeholder="Select date"
/>
```

## jQuery Integration Rules

- Import locally: `import $ from 'jquery'`
- Attach only inside component scope
- Always destroy on unmount
- Never use global `$`

## Font Setup

Source Sans Pro is loaded via @fontsource (no CDN):

```javascript
import './styles/fonts';
```

Applied globally to body with all weights (200-900).

## Error Handling

All plugin initializations are wrapped in try/catch:

- Initialization errors logged to console
- Cleanup errors handled gracefully
- UI never crashes from plugin failures

## Performance Optimizations

- jQuery plugins initialized once in useEffect
- Proper cleanup prevents memory leaks
- Grid uses virtualization for large datasets
- Fonts loaded only once via @fontsource

## Testing

Playwright tests included:

```bash
npm run test:e2e
```

Tests cover:
- Plugin initialization
- User interactions
- Error scenarios
- Memory leak detection
- Performance benchmarks

## Architecture

```
src/plugins/
  mustache/         # Template wrapper
  moment/           # Date utilities
  axios/            # HTTP client
  sweetalert/       # Alert service
  aggrid/           # Grid component
  summernote/       # Editor wrapper
  tempusdominus/    # DatePicker wrapper
```

## Security

- Mustache escapes HTML by default
- API keys from environment variables
- No global window pollution
- XSS protection in templates

## License

MIT
