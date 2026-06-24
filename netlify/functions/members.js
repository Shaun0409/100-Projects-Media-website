// netlify/functions/members.js
// Fetches members from Google Sheets via Sheet.best

// Replace with your Sheet.best connection URL
const SHEET_BEST_API = 'https://api.sheetbest.com/sheets/ea89e6d2-3087-4506-ab5b-31e9802bcd62';

const DEFAULT_OWNERS = [
    {
        id: 'owner_1',
        timestamp: '2026-06-24T00:00:00.000Z',
        name: 'Lesley Khocy',
        email: 'khocypixs@gmail.com',
        role: 'Admin (Owner)',
        message: 'Co-Founder, Visual Director, Editor In Chief'
    },
    {
        id: 'owner_2',
        timestamp: '2026-06-24T00:00:00.000Z',
        name: 'Mpilo Nhlapho',
        email: 'mpilo1@gmail.com',
        role: 'Admin (Owner)',
        message: 'Founder & CBO'
    },
    {
        id: 'owner_3',
        timestamp: '2026-06-24T00:00:00.000Z',
        name: 'Shaun Tshabalala',
        email: 'shaun@example.com',
        role: 'Admin (Developer)',
        message: 'Lead Developer'
    }
];

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        let sheetMembers = [];
        
        try {
            const response = await fetch(SHEET_BEST_API);
            if (response.ok) {
                sheetMembers = await response.json();
                // Sheet.best returns an array, ensure it's an array
                if (!Array.isArray(sheetMembers)) {
                    sheetMembers = [];
                }
            }
        } catch (e) {
            console.log('Could not fetch from Sheet.best:', e.message);
        }

        // Merge: Start with default owners, then add sheet members (deduplicate by email)
        const allMembers = [...DEFAULT_OWNERS];
        const existingEmails = new Set(DEFAULT_OWNERS.map(m => m.email.toLowerCase()));
        
        sheetMembers.forEach(m => {
            if (m.email && !existingEmails.has(m.email.toLowerCase())) {
                allMembers.push({
                    id: m.id || 'member_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                    timestamp: m.timestamp || new Date().toISOString(),
                    name: m.name || 'Unknown',
                    email: m.email || '',
                    role: m.role || 'Member',
                    message: m.message || ''
                });
                existingEmails.add(m.email.toLowerCase());
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                members: allMembers,
                count: allMembers.length
            })
        };

    } catch (error) {
        console.error('Members error:', error);
        return {
            statusCode: 200,
            body: JSON.stringify({
                members: DEFAULT_OWNERS,
                count: DEFAULT_OWNERS.length,
                error: 'Could not fetch members from Google Sheets, showing default owners'
            })
        };
    }
};
