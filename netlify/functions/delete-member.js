// netlify/functions/delete-member.js
// Deletes a member from Google Sheets via Sheet.best

// Replace with your Sheet.best connection URL
const SHEET_BEST_API = 'https://api.sheetbest.com/sheets/ea89e6d2-3087-4506-ab5b-31e9802bcd62';

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const data = JSON.parse(event.body);
        const { id, deleteAll } = data;

        // Check if it's a default owner (can't delete owners)
        if (id && id.startsWith('owner_')) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Cannot delete default owners' })
            };
        }

        // Get all members from Sheet.best
        const response = await fetch(SHEET_BEST_API);
        if (!response.ok) {
            throw new Error('Failed to fetch members');
        }

        let members = await response.json();
        if (!Array.isArray(members)) {
            members = [];
        }

        if (deleteAll) {
            // Delete all non-owner members
            let deletedCount = 0;
            for (const member of members) {
                // Skip if it's a default owner (by email check)
                const isOwner = ['khocypixs@gmail.com', 'mpilo1@gmail.com', 'shaun@example.com'].includes(member.email);
                if (!isOwner && member.id) {
                    await fetch(`${SHEET_BEST_API}/${member.id}`, {
                        method: 'DELETE'
                    });
                    deletedCount++;
                }
            }
            return {
                statusCode: 200,
                body: JSON.stringify({ 
                    success: true, 
                    message: `${deletedCount} members deleted (owners preserved)`
                })
            };
        }

        // Delete single member by ID
        if (!id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Member ID is required' })
            };
        }

        // Find the member in the sheet
        const memberToDelete = members.find(m => m.id === id || m.id === parseInt(id));
        if (!memberToDelete) {
            // Check if it's a default owner
            if (id.startsWith('owner_')) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Cannot delete default owners' })
                };
            }
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Member not found' })
            };
        }

        // Check if it's a default owner by email
        const ownerEmails = ['khocypixs@gmail.com', 'mpilo1@gmail.com', 'shaun@example.com'];
        if (ownerEmails.includes(memberToDelete.email)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Cannot delete default owners' })
            };
        }

        const deleteResponse = await fetch(`${SHEET_BEST_API}/${memberToDelete.id}`, {
            method: 'DELETE'
        });

        if (!deleteResponse.ok) {
            throw new Error('Failed to delete member');
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
