module.exports = {
    views: {
        request:  {
            map: function(doc) {
                if (doc.type === 'info-request') {
                    emit(doc.id, null);
                }
            }
        },
        list: {
            map: function(doc) {
                var status;

                if (~'waiting_response waiting_clarification internal_review'.split(' ').indexOf(doc.described_state)) {
                    status = 'Waiting';
                } else if (doc.described_state === 'rejected') {
                    status = 'Unsuccessful';
                } else if (~'partially_successful successful'.split(' ').indexOf(doc.described_state)) {
                    status = 'Successful';
                } else if (doc.described_state === 'not_held') {
                    status = 'Not Held';
                }

                if (doc.type === 'info-request') {
                    emit([new Date(doc.created_at).getFullYear(), doc.public_body.name, status], null);
                }
            }
        }
    }
};
