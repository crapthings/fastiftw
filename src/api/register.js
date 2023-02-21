const { hashPassword } = require('../utils/hash')

const registerSchema = {
  $id: 'register',
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

module.exports = function registerApi (fastify, opts, done) {
  fastify.addSchema(registerSchema)

  const registerOptions = {
    schema: {
      body: { $ref: 'register' }
    }
  }

  fastify.post('/register', registerOptions, async function (req, res) {
    try {
      const { username, password } = req.body

      const account = await this.accounts().findOne({ username })

      if (account) {
        throw new Error('username exists')
      }

      const hashedPassword = await hashPassword(password)

      const result = await this.accounts().insertOne({ username, password: hashedPassword })

      return { result }
    } catch (ex) {
      throw new Error(ex)
    }
  })

  done()
}
