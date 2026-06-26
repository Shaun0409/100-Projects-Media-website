// netlify/functions/members.js
// Fetches members from Google Sheets via Sheet.best

const SHEET_BEST_API = 'https://api.sheetbest.com/sheets/7fb06936-5f4f-4ca5-bb81-b4e8af870b57/tabs/Members';

// Must match the same function in signup.js
function emailToId(email) {
    return 'member_' + email.toLowerCase().replace(/[^a-z0-9]/g, '');
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
        const response = await fetch(SHEET_BEST_API);
        let sheetMembers = [];

        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
                sheetMembers = data;
            }
        }

        // Get query parameters
        const params = event.queryStringParameters || {};
        const statusFilter = params.status || 'all';
        const page = parseInt(params.page) || 0;
        const limit = parseInt(params.limit) || 100;

        // Build member list purely from sheet data
        const seenEmails = new Set();
        let allMembers = [];

        sheetMembers.forEach(m => {
            if (!m.email) return;
            if (seenEmails.has(m.email.toLowerCase())) return;
            seenEmails.add(m.email.toLowerCase());

            allMembers.push({
                id: m.id || emailToId(m.email),
                email: m.email,
                timestamp: m.timestamp || new Date().toISOString(),
                name: m.name || 'Unknown',
                role: m.role || 'Member',
                skills: m.skills || '',
                website: m.website || '',
                image1: m.image1 || '',
                image2: m.image2 || '',
                image3: m.image3 || '',
                status: m.status || 'pending',
                selectedImage: m.selectedImage || '',
                socialPlatform: m.socialPlatform || '',
                socialHandle: m.socialHandle || ''
            });
        });

        // Filter by status
        let filteredMembers = allMembers;
        if (statusFilter !== 'all') {
            filteredMembers = allMembers.filter(m => m.status === statusFilter);
        }

        // Sort by timestamp (newest first)
        filteredMembers.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Paginate
        const start = page * limit;
        const paginatedMembers = filteredMembers.slice(start, start + limit);

        const acceptedCount = allMembers.filter(m => m.status === 'accepted').length;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                members: paginatedMembers,
                count: acceptedCount,
                total: allMembers.length,
                accepted: acceptedCount,
                pending: allMembers.filter(m => m.status === 'pending').length,
                declined: allMembers.filter(m => m.status === 'declined').length
            })
        };
    } catch (error) {
        console.error('Members error:', error);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                members: [],
                count: 0,
                total: 0,
                accepted: 0,
                pending: 0,
                declined: 0
            })
        };
    }
};


