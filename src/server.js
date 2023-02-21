const fs = require('fs')
const path = require('path')

const fastify = require('fastify')
const fastifyJwt = require('@fastify/jwt')
const mongodb = require('@fastify/mongodb')
const { MongoClient, ObjectId } = require('mongodb')

const whitelist = require('./whitelist')

const SECRET = process.env.SECRET || 'fastiftw'
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017'
const MONGO_DB = process.env.MONGO_DB || 'fastiftw'

const apidir = fs.readdirSync('./src/api')

module.exports = async function buildServer (options = {}) {
  const {
    schemas,
    serverOptions = {},
  } = options

  const server = fastify(serverOptions)

  server.register(fastifyJwt, {
    secret: SECRET,
  })

  const client = await MongoClient.connect(MONGO_URL)

  server.register(mongodb, {
    client,
    database: MONGO_DB,
  })

  server.decorate('accounts', function () {
    return this.mongo.db.collection('accounts')
  })

  if (!schemas) {
    server.register(useDevRoutes, { prefix: '/api/v1' })
  }

  for (const url of apidir) {
    server.register(require(`./api/${url}`), { prefix: '/api/v1' })
  }

  server.get('/', async function (req, res) {
    return 'OK'
  })

  server.addHook('onClose', () => client.close(true))

  server.addHook('onRequest', async function (req, res) {
    try {
      if (whitelist[req.url]) {
        return
      }
      await req.jwtVerify()
    } catch (err) {
      res.send(err)
    }
  })

  return server
}

function useDevRoutes (server, opts, done) {
  server.post('/:collectionName', async function (req, res) {
    const { collectionName } = req.params

    const collection = this.mongo.db.collection(collectionName)

    const { _id, userId, ...newDoc } = req.body

    try {
      const result = await collection.insertOne({ ...newDoc, userId: req.user._id })

      return {
        result
      }

    } catch (ex) {
      throw new Error(ex)
    }
  })

  server.get('/:collectionName', async function (req, res) {
    try {
      const { collectionName } = req.params

      const collection = this.mongo.db.collection(collectionName)

      const result = await collection.find({ userId: req.user._id }).toArray()

      return {
        result
      }
    } catch (ex) {
      throw new Error(ex)
    }
  })

  server.get('/:collectionName/:id', async function (req, res) {
    try {
      const { collectionName, id } = req.params

      const collection = this.mongo.db.collection(collectionName)

      const _id = new ObjectId(id)

      const doc = await collection.findOne({ _id} )

      if (doc.userId !== req.user._id) {
        throw new Error(`require authorization`)
      }

      const result = await this.mongo.db.collection(collectionName).findOne({ _id })

      return {
        result
      }
    } catch (ex) {
      throw new Error(ex)
    }
  })

  server.put('/:collectionName/:id', async function (req, res) {
    try {
      const { collectionName, id } = req.params

      const { _id: $id, userId, ...newDoc } = req.body

      const collection = this.mongo.db.collection(collectionName)

      const _id = new ObjectId(id)

      const doc = await collection.findOne({ _id} )

      if (doc.userId !== req.user._id) {
        throw new Error(`require authorization`)
      }

      const result = await collection.updateOne({ _id }, { $set: { ...newDoc } })

      return {
        result
      }
    } catch (ex) {
      throw new Error(ex)
    }
  })

  server.delete('/:collectionName/:id', async function (req, res) {
    try {
      const { collectionName, id } = req.params

      const collection = this.mongo.db.collection(collectionName)

      const _id = new ObjectId(id)

      const doc = await collection.findOne({ _id} )

      if (doc.userId !== req.user._id) {
        throw new Error(`require authorization`)
      }

      const result = await collection.deleteOne({ _id })

      return {
        result
      }
    } catch (ex) {
      throw new Error(ex)
    }
  })

  done()
}
