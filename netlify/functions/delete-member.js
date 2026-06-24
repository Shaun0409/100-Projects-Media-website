// netlify/functions/delete-member.js
// Deletes a member via Google Apps Script API

const API_BASE = 'https://script.google.com/macros/s/AKfycbzr0Z1TpP1VzkUOTwM39ef49bdL8Fspj9V7QPROuG0tDYwGB7mS7-__V8OfFx6fDKt2KQ/exec';

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { id, deleteAll } = JSON.parse(event.body);

        // Check if it's a default owner (can't delete owners)
        if (id && id.startsWith('owner_')) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Cannot delete default owners' })
            };
        }

        // Delete all non-owner members
        if (deleteAll) {
            // We need to get all members first
            const getResponse = await fetch(`${API_BASE}?action=getMembers`);
            const data = await getResponse.json();
            
            if (data.members && Array.isArray(data.members)) {
                const ownerEmails = ['khocypixs@gmail.com', 'mpilo1@gmail.com', 'shaun@example.com'];
                for (const member of data.members) {
                    if (!ownerEmails.includes(member.email)) {
                        await fetch(`${API_BASE}?action=deleteMember`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: member.email })
                        });
                    }
                }
            }
            
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'Non-owner members deleted' })
            };
        }

        // Delete single member by email
        // We need the email to delete by, since the API uses email as identifier
        // The ID might be coming from the frontend, so we need to get the email
        const getResponse = await fetch(`${API_BASE}?action=getMembers`);
        const data = await getResponse.json();
        
        if (!data.members || !Array.isArray(data.members)) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Member not found' })
            };
        }

        // Find member by ID (which is stored in the sheet)
        const member = data.members.find(m => m.id === id || m.id === parseInt(id));
        if (!member) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Member not found' })
            };
        }

        // Check if it's a default owner
        const ownerEmails = ['khocypixs@gmail.com', 'mpilo1@gmail.com', 'shaun@example.com'];
        if (ownerEmails.includes(member.email)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Cannot delete default owners' })
            };
        }

        const response = await fetch(`${API_BASE}?action=deleteMember`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: member.email })
        });

        const result = await response.json();

        if (result.error) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: result.error })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Member deleted' })
        };
    } catch (error) {
        console.error('Delete error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to delete member: ' + error.message })
        };
    }
};