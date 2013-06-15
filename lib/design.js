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
                if (doc.type === 'info-request') {
                    emit([new Date(doc.created_at).getFullYear(), doc.public_body.name], null);
                }
            }
        }
    }
};
