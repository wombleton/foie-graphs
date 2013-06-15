module.exports = {
    views: {
        request:  {
            map: function(doc) {
                if (doc.type === 'info-request') {
                    emit(doc.id, null);
                }
            }
        }
    }
};
