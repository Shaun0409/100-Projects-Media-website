// netlify/functions/update-member.js
// Updates a member's status or selected image

const SHEET_BEST_API = 'https://api.sheetbest.com/sheets/7fb06936-5f4f-4ca5-bb81-b4e8af870b57/tabs/Members';

exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'POST' && event.httpMethod !== 'PUT') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { id, status, selectedImage, name, role, skills } = JSON.parse(event.body);

        if (!id) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Member ID is required' })
            };
        }

        // Get the member from Sheet.best
        const getResponse = await fetch(SHEET_BEST_API);
        if (!getResponse.ok) {
            throw new Error('Failed to fetch members from Sheet.best');
        }

        const members = await getResponse.json();
        
        // Find the member by ID
        let memberToUpdate = null;
        let memberIndex = -1;
        
        for (let i = 0; i < members.length; i++) {
            const m = members[i];
            if (m.id === id || m.id === parseInt(id) || String(m.id) === String(id)) {
                memberToUpdate = m;
                memberIndex = i;
                break;
            }
        }

        if (!memberToUpdate) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Member not found' })
            };
        }

        // Update fields
        if (status !== undefined) memberToUpdate.status = status;
        if (selectedImage !== undefined) memberToUpdate.selectedImage = selectedImage;
        if (name !== undefined) memberToUpdate.name = name;
        if (role !== undefined) memberToUpdate.role = role;
        if (skills !== undefined) memberToUpdate.skills = skills;

        // Try PUT first
        let updateResponse = await fetch(`${SHEET_BEST_API}/${memberToUpdate.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(memberToUpdate)
        });

        // If PUT fails, try POST
        if (!updateResponse.ok) {
            console.log('PUT failed, trying POST...');
            updateResponse = await fetch(`${SHEET_BEST_API}/${memberToUpdate.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(memberToUpdate)
            });
        }

        // If POST fails, try without the ID in the URL (write new row)
        if (!updateResponse.ok) {
            console.log('POST with ID failed, trying to add new row...');
            // Delete the old row first
            await fetch(`${SHEET_BEST_API}/${memberToUpdate.id}`, {
                method: 'DELETE'
            }).catch(() => {});
            
            // Add as new row
            updateResponse = await fetch(SHEET_BEST_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(memberToUpdate)
            });
        }

        if (!updateResponse.ok) {
            throw new Error('Failed to update member in Sheet.best');
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Member updated successfully',
                member: memberToUpdate
            })
        };
    } catch (error) {
        console.error('Update error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false,
                error: 'Failed to update member: ' + error.message 
            })
        };
    }
};