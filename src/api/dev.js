const { comparePassword } = require('../utils/hash')

module.exports = function loginApi (fastify, opts, done) {

  fastify.post('/dev/reset', async function (req, res) {
    try {
      const collectionNames = req.body

      for (const collectionName of collectionNames) {
        await this.mongo.db.collection(collectionName).deleteMany({})
      }

      return 'OK'
    } catch (ex) {
      throw new Error(ex)
    }
  })

  done()
}
