Prompt — Document Finder Dashboard (Use Existing ENV Setup)

Act as a Senior Full Stack Developer working on a React + Vite CMS platform.

Create a Document Finder Dashboard that retrieves records from the Shareandinvite collection and displays them in a table using AG-Grid Enterprise.

⚠️ Important Requirement
The project already has environment configuration implemented.
Do NOT introduce new environment variables or API config.

Instead:

Reuse the existing ENV setup

Reuse existing API helpers

Follow the same reference pattern used in other modules

1. Environment Setup (Reuse Existing)

Verify how the project currently handles environment configuration.

Example (already implemented in project):

API_PATH
API_GET_DOCS

Example pattern (for reference only — reuse the same approach):

API_GET_DOCS = API_PATH + "getdocs"

The dashboard must import the same config used elsewhere.

Do not duplicate environment logic.

2. Endpoint

Use the existing endpoint:

API_GET_DOCS

which internally resolves based on domain:

DEV
UAT
PROD
LIVE
3. Default Query Payload

On dashboard load, automatically fetch records using:

payload = {
  tbl: "Shareandinvite",
  find: {
    "key": { $exists: true }
  },
  limit: 10,
  sort: { time_c: -1 }
}

Pagination:

limit = 10 per page
4. Local Config Folder

The system should check for local configuration data.

Example location:

config/
docids.json

Example file:

{
 "docids":[
  "Nfe50d898-e628-4804-a248-b364d6f55774"
 ]
}

If present:

include docid filtering

merge with query payload

5. Query Builder

Provide a UI where the user can modify the find query.

User can add conditions for:

client
identifier
docid
status
titleinfo.cover
rolename

Example generated query:

find:{
 client:"OUP",
 status:"signoff"
}

User actions:

Edit query
Click fetch
Auto reload table
6. AG-Grid Table

Use AG-Grid Enterprise.

Columns:

Client
Identifier
DocID
Status
Journal (titleinfo.cover)
Project Title
Role Name
Open Link

Field mapping:

client
identifier
docid
status
titleinfo.cover
projecttitle
rolename
7. Example API Record

Example record returned from API:

{
 "_id":"N00150bd6-edab-4bcf-a031-efb48b37fa94",
 "client":"OUP",
 "identifier":"10.1093/stcltm/szad014",
 "docid":"Nfe50d898-e628-4804-a248-b364d6f55774",
 "status":"signoff",
 "rolename":"Author",
 "titleinfo":{
   "doctitle":"Rapid and Live-Cell Detection...",
   "identifier":"10.1093/stcltm/szad014",
   "cover":"STCLTM"
 }
}
8. Open Link Column

Add Open button column.

When clicked:

const base = location.href.split("/")
base.pop()

const url = base.join("/") + "/" + record.editor

window.open(url,"_blank")

This opens the editor page in a new tab.

9. AG-Grid Features

Enable enterprise features:

sorting
column filters
pagination
column resizing
excel export
row grouping

Performance support:

server side pagination
large dataset handling
10. Dashboard Layout
Document Finder Dashboard
--------------------------------

Query Builder
Fetch Button

--------------------------------

AG-Grid Table

--------------------------------

Pagination
11. Error Handling

Handle:

API errors
empty results
invalid query
network failure

Display proper UI alerts.

12. File Structure

Follow the existing project structure.

Create:

src/pages/DocFinderDashboard.jsx

src/components/DocFinder
  QueryBuilder.jsx
  DocsGrid.jsx
  FetchToolbar.jsx

src/services
  docsApi.js

⚠️ If the project already has a shared API service, reuse it instead.

13. docsApi Service

Use existing API helpers where possible.

Example pattern:

export async function fetchDocs(payload){
 return fetch(API_GET_DOCS,{
   method:"POST",
   headers:{ "Content-Type":"application/json" },
   body:JSON.stringify(payload)
 }).then(res=>res.json())
}
14. UI Theme

Follow the platform theme:

Primary Color: #ff8635

Apply to:

buttons
highlight rows
fetch button
15. Performance

Must support datasets:

100k+ records

Use:

AG-Grid server side model
virtual scrolling
Expected Output

Generate:

DocFinderDashboard.jsx
QueryBuilder.jsx
DocsGrid.jsx
docsApi.js

Code must integrate with existing ENV and API configuration already present in the project.