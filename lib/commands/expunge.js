'use strict';

const { getStatusCode } = require('../tools.js');

// Deletes specified messages
module.exports = async (connection, range, options) => {
    if (connection.state !== connection.states.SELECTED || !range) {
        // nothing to do here
        return;
    }

    options = options || {};

    await connection.messageFlagsAdd(range, ['\\Deleted'], options);

    let byUid = options.uid && connection.capabilities.has('UIDPLUS');
    let command = byUid ? 'UID EXPUNGE' : 'EXPUNGE';
    let attributes = byUid ? [{ type: 'SEQUENCE', value: range }] : false;

    let response;
    try {
        response = await connection.exec(command, attributes);
        response.next();
        return true;
    } catch (err) {
        let errorCode = getStatusCode(err.response);
        if (errorCode) {
            err.serverResponseCode = errorCode;
        }

        connection.log.error(err);
        return false;
    }
};
