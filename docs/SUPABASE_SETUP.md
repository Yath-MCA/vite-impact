# Supabase Integration Setup Guide

## 📋 Prerequisites

1. Supabase account with project created
2. Project URL: `https://ouluxdinlqcbvlmvncot.supabase.co`
3. Node.js dependencies installed: `npm install`

---

## 🔧 Step 1: Environment Configuration

Create `.env.local` file in project root:

```bash
VITE_SUPABASE_URL=https://ouluxdinlqcbvlmvncot.supabase.co
VITE_SUPABASE_ANON_KEY=<your_publishable_anon_key>
```

**Get your keys from:**
- Supabase Dashboard → Settings → API
- Copy the **URL** and **anon/public** key

---

## 🗄️ Step 2: Database Setup

### A. Create Content Metadata Table

```sql
CREATE TABLE content_metadata (
  id BIGSERIAL PRIMARY KEY,
  xml_data TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add sample data
INSERT INTO content_metadata (xml_data) VALUES 
('<metadata><title>Sample Article</title><author>John Doe</author><published>2026-03-05</published><keywords>research, science</keywords></metadata>'),
('<metadata><title>Another Document</title><author>Jane Smith</author><published>2026-03-04</published><keywords>technology, AI</keywords></metadata>');
```

### B. Create RPC Function for XML Parsing

```sql
CREATE OR REPLACE FUNCTION get_content_metadata_parsed(p_limit int DEFAULT 50)
RETURNS TABLE (
  id          bigint,
  title       text,
  author      text,
  published   text,
  keywords    text
) 
LANGUAGE sql 
SECURITY DEFINER
AS $$
  SELECT
    cm.id,
    x.title,
    x.author,
    x.published,
    x.keywords
  FROM content_metadata cm
  CROSS JOIN LATERAL xmltable(
    '/metadata'
    PASSING cm.xml_data::xml
    COLUMNS
      title     text PATH 'title',
      author    text PATH 'author',
      published text PATH 'published',
      keywords  text PATH 'keywords'
  ) AS x
  LIMIT p_limit;
$$;
```

### C. Set Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE content_metadata ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated read" 
ON content_metadata 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow public read (if needed)
CREATE POLICY "Allow public read" 
ON content_metadata 
FOR SELECT 
TO anon 
USING (true);
```

---

## 📁 Step 3: Storage Bucket Setup

### Create 'publishing' Bucket

1. Go to Supabase Dashboard → Storage
2. Create new bucket: `publishing`
3. Set as **Public** or configure RLS policies:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'publishing');

-- Allow public download
CREATE POLICY "Allow public download"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'publishing');
```

4. Upload test files for FileDashboard demo

---

## 🚀 Step 4: Run the Application

```bash
npm run dev
```

Navigate to: `http://localhost:3000/supabase`

---

## 🧪 Features Available

### 🔐 Auth Tab
- Sign up with email/password
- Sign in existing users
- Forgot password flow
- Auto-logout button when authenticated

### 📁 File Dashboard Tab
- Lists all files in 'publishing' bucket
- Download any file
- Shows file metadata (size, modified date)

### 🗂 Content Metadata RPC Tab
- Calls `get_content_metadata_parsed()` function
- Displays parsed XML data in table format
- Adjustable result limit

---

## 🔍 Troubleshooting

### "VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set"
- Check `.env.local` exists in project root
- Restart dev server after creating `.env.local`

### "Failed to load files"
- Verify 'publishing' bucket exists
- Check RLS policies allow access
- Ensure user is authenticated (if required)

### "RPC function not found"
- Run the SQL function creation script
- Check function name matches: `get_content_metadata_parsed`

---

## 📦 Dependencies Installed

```json
{
  "@supabase/supabase-js": "^2.x.x",
  "@supabase/auth-ui-react": "^0.x.x",
  "@supabase/auth-ui-shared": "^0.x.x"
}
```

---

## 🔒 Security Notes

1. **Never commit `.env.local`** - already in `.gitignore`
2. **Anon key is safe to expose** - it's for client-side use
3. **Service role key** - Keep secret! Never expose in frontend
4. **RLS policies** - Always enable for production tables

---

## 📚 Additional Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [PostgreSQL xmltable](https://www.postgresql.org/docs/current/functions-xml.html)
