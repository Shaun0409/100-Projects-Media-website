// netlify/functions/delete-member.js
// Deletes a member from members.json

const fs = require('fs');
const path = require('path');

const MEMBERS_FILE = path.join(__dirname, '..', '..', 'members.json');

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

function writeMembers(data) {
    try {
        fs.writeFileSync(MEMBERS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing members file:', error);
        return false;
    }
}

exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { id } = JSON.parse(event.body);

        if (id && id.startsWith('owner_')) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Cannot delete default owners' })
            };
        }

        const membersData = readMembers();

        if (!membersData.members || membersData.members.length === 0) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'No members found' })
            };
        }

        const memberToDelete = membersData.members.find(m => m.id === id);
        if (!memberToDelete) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Member not found' })
            };
        }

        // Filter out the member
        membersData.members = membersData.members.filter(m => m.id !== id);
        membersData.count = membersData.members.length;

        writeMembers(membersData);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Member deleted' })
        };
    } catch (error) {
        console.error('Delete error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to delete member: ' + error.message })
        };
    }
};