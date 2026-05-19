# Supabase Integration Plan: Netra Graphics Dashboard

This document outlines the recommended client-side directory structure, backend architecture, and PostgreSQL database schemas to migrate **Netra Graphics** (Creative Studio Command Center) from local mock states to a robust, real-time Supabase backend.

---

## 1. Client-Side (React/Vite) File Structure

Within the React app (`src/`), a modular layout isolates database and authentication calls from your UI view layer (`App.jsx`).

```text
src/
├── supabase/                    # Core folder for Supabase configurations
│   ├── client.js                # Instantiates Supabase client with environment variables
│   ├── auth.jsx                 # AuthContext and AuthProvider for studio login
│   ├── database/                # Modular database layers for each domain
│   │   ├── inquiries.js         # Fetch, insert, and update Sparks (inquiries)
│   │   ├── clients.js           # Client records and vault passcode verifications
│   │   ├── projects.js          # Project Ignition CRUD (milestones, activity logs, chat)
│   │   ├── invoices.js          # Invoice saves and prints
│   │   └── index.js             # Centralized database export hub
│   └── hooks/                   
│       ├── useAuth.js           # Quick hook for session consumption
│       ├── useDashboard.js      # Global hook tracking dashboard stats & queries
│       └── useClientVault.js    # Client-specific portal query manager
```

---

## 2. Backend Architecture Option (Supabase CLI)

Since Netra Graphics contains features like a "Media Vault" (for graphics assets) and real-time collaboration streams, leveraging the **Supabase CLI** natively (without an extra server) is highly recommended. 

```text
netra-graphics/                  # Root workspace
├── supabase/                    # Supabase CLI project folder
│   ├── config.toml              # Main configuration (port mappings, local emulator)
│   ├── seed.sql                 # Sample dashboard data (mock invoices, inquiries, projects)
│   ├── migrations/              # PostgreSQL schema migrations
│   │   ├── 20260519000000_init_tables.sql       # Inquiries, Clients, Projects, Invoices
│   │   └── 20260519000001_project_relations.sql  # Milestones, activity logs, collaboration stream
│   └── functions/               # Supabase Edge Functions (Deno / TypeScript)
│       └── generate-pdf-receipt/ # Handles high-fidelity automated invoice PDF builds
│           └── index.ts         
├── src/                         
└── package.json
```

---

## 3. Relational PostgreSQL Database Schema

To replace the local arrays in `App.jsx` (`inquiries`, `clients`, `ignitionQueue`, `invoices`), we map them into structured PostgreSQL tables. This resolves nested arrays (`collaborationStream`, `milestones`, `mediaVault`) into sub-tables with foreign keys.

### Migration script: `20260519000000_init_tables.sql`

```sql
-- 1. CLIENTS TABLE
CREATE TABLE clients (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  status VARCHAR(50) DEFAULT 'Active',
  access_key VARCHAR(100) NOT NULL, -- Client passcode for vault access
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. INQUIRIES (SPARKS) TABLE
CREATE TABLE inquiries (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  service VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'New Spark' NOT NULL, -- 'New Spark', 'Contacted', etc.
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. PROJECTS (IGNITION QUEUE / FLAMES) TABLE
CREATE TABLE projects (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  service VARCHAR(255) NOT NULL,
  stage INT DEFAULT 1 NOT NULL, -- 1 = Discovery, 2 = Moodboard, 3 = Sketching, 4 = Final Flame
  status VARCHAR(50) DEFAULT 'Ongoing' NOT NULL, -- 'Ongoing', 'Completed', 'Pending'
  quote NUMERIC(12, 2) NOT NULL,
  discount NUMERIC(12, 2) DEFAULT 0.00,
  discount_value VARCHAR(50), -- E.g. '2000'
  discount_type VARCHAR(10) DEFAULT 'rs', -- 'rs' or '%'
  advance_amount NUMERIC(12, 2) DEFAULT 0.00,
  payment_status VARCHAR(50) DEFAULT 'part', -- 'unpaid', 'part', 'paid'
  deadline DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. PROJECT MILESTONES TABLE
CREATE TABLE project_milestones (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  position INT NOT NULL -- Ordering position
);

-- 5. PROJECT ACTIVITY LOGS TABLE
CREATE TABLE project_activity_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  action VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. PROJECT COLLABORATION STREAM (CHAT) TABLE
CREATE TABLE project_chats (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  sender VARCHAR(50) NOT NULL, -- 'SYSTEM', 'ADMIN', 'CLIENT'
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. PROJECT MEDIA ASSETS (MEDIA VAULT) TABLE
CREATE TABLE project_media (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50), -- 'image', 'video', 'document'
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. INVOICES TABLE
CREATE TABLE invoices (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  invoice_no VARCHAR(100) UNIQUE NOT NULL,
  project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
  client_name VARCHAR(255) NOT NULL,
  project_service VARCHAR(255) NOT NULL,
  issue_date DATE DEFAULT CURRENT_DATE NOT NULL,
  grand_total NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

---

## 4. Integration Code Templates

### Supabase Initialization (`src/supabase/client.js`)
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Real-Time Chat Subscription Hook (`src/supabase/database/projects.js`)
Since Netra Graphics allows clients and studio admins to stream chat comments, Supabase Realtime fits perfectly:

```javascript
import { supabase } from '../client';

/**
 * Fetch all collaboration stream messages for a project
 */
export const getProjectChats = async (projectId) => {
  const { data, error } = await supabase
    .from('project_chats')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

/**
 * Send a chat message
 */
export const sendChatMessage = async (projectId, sender, messageText) => {
  const { data, error } = await supabase
    .from('project_chats')
    .insert([{ project_id: projectId, sender, message: messageText }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Subscribe to real-time chat updates on a project
 */
export const subscribeToProjectChats = (projectId, onMessageReceived) => {
  return supabase
    .channel(`project-chat-${projectId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'project_chats',
        filter: `project_id=eq.${projectId}`
      },
      (payload) => {
        onMessageReceived(payload.new);
      }
    )
    .subscribe();
};
```

---

## 5. Storage (Media Vault Integration)

Your "Media Vault" can utilize **Supabase Storage** to save clients' source assets and review concepts.

*   Create a bucket in Supabase dashboard called `'studio-vault'`.
*   Upload handler inside `src/supabase/database/projects.js`:

```javascript
/**
 * Upload asset to Supabase Storage and register metadata in 'project_media'
 */
export const uploadVaultAsset = async (projectId, file, fileName) => {
  const fileExt = file.name.split('.').pop();
  const filePath = `projects/${projectId}/${Date.now()}_${fileName}.${fileExt}`;

  // 1. Upload to Supabase Storage Bucket
  const { error: uploadError } = await supabase.storage
    .from('studio-vault')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // 2. Get Public URL
  const { data: { publicUrl } } = supabase.storage
    .from('studio-vault')
    .getPublicUrl(filePath);

  // 3. Register in project_media table
  const { data, error: dbError } = await supabase
    .from('project_media')
    .insert([
      {
        project_id: projectId,
        file_name: fileName,
        file_url: publicUrl,
        file_type: file.type.split('/')[0] // 'image', 'video', etc.
      }
    ])
    .select()
    .single();

  if (dbError) throw dbError;
  return data;
};
```
