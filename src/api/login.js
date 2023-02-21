const { comparePassword } = require('../utils/hash')

const loginSchema = {
  $id: 'login',
  type: 'object',
  properties: {
    username: { type: 'string' },
    password: { type: 'string' }
  },
  required: [
    'username',
    'password',
  ],
}

module.exports = function loginApi (fastify, opts, done) {
  fastify.addSchema(loginSchema)

  const loginOptions = {
    schema: {
      body: { $ref: 'login' }
    }
  }

  fastify.post('/login', loginOptions, async function (req, res) {
    try {
      const { username, password } = req.body

      const account = await this.accounts().findOne({ username })

      if (!account) {
        throw new Error(`user doesn't exist`)
      }

      const matchedPassword = await comparePassword(password, account.password)

      if (!matchedPassword) {
        throw new Error('wrong password')
      }

      const token = server.jwt.sign({ _id: account._id, username })

      return {
        result: token
      }
    } catch (ex) {
      throw new Error(ex)
    }
  })

  done()
}
