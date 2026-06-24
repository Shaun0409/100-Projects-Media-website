// netlify/functions/members.js
// Fetches members from Google Apps Script API

const API_BASE = 'https://script.google.com/macros/s/AKfycbzr0Z1TpP1VzkUOTwM39ef49bdL8Fspj9V7QPROuG0tDYwGB7mS7-__V8OfFx6fDKt2KQ/exec';

// Default owners (first 3 members)
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
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const response = await fetch(`${API_BASE}?action=getMembers`);
        const data = await response.json();
        
        // Combine owners with sheet members
        const allMembers = [...DEFAULT_OWNERS];
        const existingEmails = new Set(DEFAULT_OWNERS.map(m => m.email.toLowerCase()));
        
        if (data.members && Array.isArray(data.members)) {
            data.members.forEach(m => {
                if (m.email && !existingEmails.has(m.email.toLowerCase())) {
                    allMembers.push({
                        id: m.id || 'member_' + Date.now(),
                        timestamp: m.timestamp || new Date().toISOString(),
                        name: m.name || 'Unknown',
                        email: m.email || '',
                        role: m.role || 'Member',
                        message: m.message || ''
                    });
                    existingEmails.add(m.email.toLowerCase());
                }
            });
        }
        
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
                count: DEFAULT_OWNERS.length
            })
        };
    }
};