// netlify/functions/partners.js
// Manages partners via partners.json

const fs = require('fs');
const path = require('path');

const PARTNERS_FILE = path.join(__dirname, '..', '..', 'partners.json');

function readPartners() {
    try {
        if (fs.existsSync(PARTNERS_FILE)) {
            const data = fs.readFileSync(PARTNERS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading partners file:', error);
    }
    return { logos: [] };
}

function writePartners(data) {
    try {
        fs.writeFileSync(PARTNERS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing partners file:', error);
        return false;
    }
}

exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    // GET - fetch all partners
    if (event.httpMethod === 'GET') {
        try {
            const data = readPartners();
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(data)
            };
        } catch (error) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ logos: [] })
            };
        }
    }

    // POST - add a new partner
    if (event.httpMethod === 'POST') {
        try {
            const { url, name } = JSON.parse(event.body);

            if (!url || !name) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'URL and name are required' })
                };
            }

            const partnersData = readPartners();
            partnersData.logos.push({
                id: 'partner_' + Date.now(),
                name: name,
                url: url
            });
            writePartners(partnersData);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    logos: partnersData.logos
                })
            };
        } catch (error) {
            console.error('Add partner error:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Failed to add partner: ' + error.message })
            };
        }
    }

    // DELETE - remove a partner
    if (event.httpMethod === 'DELETE') {
        try {
            const { id } = JSON.parse(event.body);

            if (!id) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'ID is required' })
                };
            }

            const partnersData = readPartners();
            const partnerToDelete = partnersData.logos.find(p => p.id === id);
            if (!partnerToDelete) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Partner not found' })
                };
            }

            partnersData.logos = partnersData.logos.filter(p => p.id !== id);
            writePartners(partnersData);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    logos: partnersData.logos
                })
            };
        } catch (error) {
            console.error('Delete partner error:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Failed to delete partner: ' + error.message })
            };
        }
    }

    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
    };
};