// netlify/functions/signup.js
// Adds a member via Google Apps Script API

const API_BASE = 'https://script.google.com/macros/s/AKfycbzr0Z1TpP1VzkUOTwM39ef49bdL8Fspj9V7QPROuG0tDYwGB7mS7-__V8OfFx6fDKt2KQ/exec';

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { name, email, role, message } = JSON.parse(event.body);

        if (!name || !email || !role) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Name, email, and role are required' })
            };
        }

        const response = await fetch(`${API_BASE}?action=addMember`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, role, message: message || '' })
        });

        const data = await response.json();

        if (data.error) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: data.error })
            };
        }

        // Get updated count
        const countResponse = await fetch(`${API_BASE}?action=getMembers`);
        const countData = await countResponse.json();
        const count = countData.members ? countData.members.length + 3 : 3; // +3 for owners

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                count: count,
                message: 'Successfully joined the community!'
            })
        };
    } catch (error) {
        console.error('Signup error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to save member data: ' + error.message })
        };
    }
};