const bcrypt = require('bcrypt')

exports.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)
  return hashedPassword
}

exports.comparePassword = async function (password, hashedPassword) {
  const matched = await bcrypt.compare(password, hashedPassword)
  return matched
}
