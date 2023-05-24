const { responseMessage } = require("../models/responseMessage");

const _validationOptions = {
  abortEarly: false,  // abort after the last validation error
  allowUnknown: true, // allow unknown keys that will be ignored
  stripUnknown: true  // remove unknown keys from the validated data
};
exports.validate = (schema) => (req, res, next) => {

  const { error, value } = schema.validate(req.body, _validationOptions);

  if (error) {
    // return res.status(422).send(  error.details[0].message  )
    let m = error.details[0].message
    let array = m.split('"')
    let a1 = array[1].toString()
    let a2 = array[2].toString()
    a3 = a1.concat(a2)
    return responseMessage(res, 422, 0, a3, null)
  }

  else {
    req.body = value
    next()
  }
}