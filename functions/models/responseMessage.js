exports.responseMessage = (res, status, customstatus, message, data) => {
    res.status(status).send(data === null ? { status: customstatus, message } : { status: customstatus, message, data })
}