// netlify/functions/signup.js
// Saves member data to members.json

const fs = require('fs');
const path = require('path');

// Path to members.json
const MEMBERS_FILE = path.join(__dirname, '..', '..', 'members.json');

// Helper to read members
function readMembers() {
    try {
        if (fs.existsSync(MEMBERS_FILE)) {
            const data = fs.readFileSync(MEMBERS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading members file:', error);
    }
    return { members: [], count: 3 };
}

// Helper to write members
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
        const { name, email, role, message } = JSON.parse(event.body);

        if (!name || !email || !role) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Name, email, and role are required' })
            };
        }

        // Read existing members
        const membersData = readMembers();

        // Check if already 100 members
        if (membersData.count >= 100) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Community is full! We\'ve reached 100 members.' })
            };
        }

        // Check if email already exists
        const existingMember = membersData.members.find(m => m.email === email);
        if (existingMember) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'This email is already registered.' })
            };
        }

        // Add new member
        const newMember = {
            id: 'member_' + Date.now(),
            timestamp: new Date().toISOString(),
            name: name,
            email: email,
            role: role,
            message: message || ''
        };

        membersData.members.push(newMember);
        membersData.count += 1;

        // Save to file
        const saved = writeMembers(membersData);

        if (!saved) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Failed to save member data' })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                count: membersData.count,
                message: 'Successfully joined the community!'
            })
        };
    } catch (error) {
        console.error('Signup error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to save member data: ' + error.message })
        };
    }
};