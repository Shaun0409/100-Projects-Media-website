// netlify/functions/partners.js
// Manages partners via Google Sheets via Sheet.best

// ⚠️ REPLACE THIS WITH YOUR ACTUAL SHEET.BEST URL
const SHEET_BEST_API = 'https://api.sheetbest.com/sheets/7fb06936-5f4f-4ca5-bb81-b4e8af870b57/tabs/Partners';

exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: headers,
            body: ''
        };
    }

    // GET - fetch all partners
    if (event.httpMethod === 'GET') {
        try {
            const response = await fetch(SHEET_BEST_API);
            if (response.ok) {
                const data = await response.json();
                return {
                    statusCode: 200,
                    headers: headers,
                    body: JSON.stringify({ logos: Array.isArray(data) ? data : [] })
                };
            }
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify({ logos: [] })
            };
        } catch (error) {
            console.error('GET partners error:', error);
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify({ logos: [] })
            };
        }
    }

    // POST - add a new partner
    if (event.httpMethod === 'POST') {
        try {
            const body = JSON.parse(event.body);
            const { url, name } = body;

            if (!url || !name) {
                return {
                    statusCode: 400,
                    headers: headers,
                    body: JSON.stringify({ error: 'URL and name are required' })
                };
            }

            const response = await fetch(SHEET_BEST_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: 'partner_' + Date.now(),
                    name: name,
                    url: url
                })
            });

            if (!response.ok) {
                throw new Error('Failed to add partner to Sheet.best');
            }

            // Get updated list
            const getResponse = await fetch(SHEET_BEST_API);
            const data = await getResponse.json();

            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify({
                    success: true,
                    logos: Array.isArray(data) ? data : []
                })
            };
        } catch (error) {
            console.error('Add partner error:', error);
            return {
                statusCode: 500,
                headers: headers,
                body: JSON.stringify({ error: 'Failed to add partner: ' + error.message })
            };
        }
    }

    // DELETE - remove a partner
    if (event.httpMethod === 'DELETE') {
        try {
            const body = JSON.parse(event.body);
            const { id } = body;

            if (!id) {
                return {
                    statusCode: 400,
                    headers: headers,
                    body: JSON.stringify({ error: 'ID is required' })
                };
            }

            // Find the partner to delete
            const getResponse = await fetch(SHEET_BEST_API);
            if (!getResponse.ok) {
                throw new Error('Failed to fetch partners');
            }

            const partners = await getResponse.json();
            const partnerToDelete = Array.isArray(partners) ? partners.find(p => p.id === id) : null;

            if (!partnerToDelete) {
                return {
                    statusCode: 404,
                    headers: headers,
                    body: JSON.stringify({ error: 'Partner not found' })
                };
            }

            // Delete from Sheet.best
            const deleteResponse = await fetch(`${SHEET_BEST_API}/${partnerToDelete.id}`, {
                method: 'DELETE'
            });

            if (!deleteResponse.ok) {
                throw new Error('Failed to delete partner from Sheet.best');
            }

            // Get updated list
            const refreshResponse = await fetch(SHEET_BEST_API);
            const data = await refreshResponse.json();

            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify({
                    success: true,
                    logos: Array.isArray(data) ? data : []
                })
            };
        } catch (error) {
            console.error('Delete partner error:', error);
            return {
                statusCode: 500,
                headers: headers,
                body: JSON.stringify({ error: 'Failed to delete partner: ' + error.message })
            };
        }
    }

    return {
        statusCode: 405,
        headers: headers,
        body: JSON.stringify({ error: 'Method not allowed' })
    };
};