// netlify/functions/members.js
// Reads members from members.json

const fs = require('fs');
const path = require('path');

const MEMBERS_FILE = path.join(__dirname, '..', '..', 'members.json');

// Default owners
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

function readMembers() {
    try {
        if (fs.existsSync(MEMBERS_FILE)) {
            const data = fs.readFileSync(MEMBERS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading members file:', error);
    }
    return { members: [], count: 0 };
}

exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const data = readMembers();
        const allMembers = [...DEFAULT_OWNERS];
        const existingEmails = new Set(DEFAULT_OWNERS.map(m => m.email.toLowerCase()));

        if (data.members && Array.isArray(data.members)) {
            data.members.forEach(m => {
                if (m.email && !existingEmails.has(m.email.toLowerCase())) {
                    allMembers.push(m);
                    existingEmails.add(m.email.toLowerCase());
                }
            });
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                members: allMembers,
                count: allMembers.length
            })
        };
    } catch (error) {
        console.error('Members error:', error);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                members: DEFAULT_OWNERS,
                count: DEFAULT_OWNERS.length
            })
        };
    }
};