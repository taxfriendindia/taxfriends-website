import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Assuming script is in /scripts, .env is in root ../.env
const envPath = path.resolve(__dirname, '../.env');

if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found at', envPath);
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};

// Simple parsing of .env
envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        const key = match[1];
        let value = match[2] || '';
        // Remove quotes if present
        if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
            value = value.replace(/^"|"$/g, '');
        }
        env[key] = value;
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Could not find VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
    process.exit(1);
}

console.log(`🔌 Connecting to Supabase at ${supabaseUrl}...`);

try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
        }
    });

    if (response.ok) {
        console.log('✅ SUCCESS! Supabase project is active and responding.');
        console.log('   (This activity has been logged by Supabase and should reset the pause timer.)');
    } else {
        console.error(`⚠️  Warning: Received status ${response.status} from Supabase.`);
        console.error(await response.text());
    }
} catch (error) {
    console.error('❌ Error connecting to Supabase:', error.message);
}
