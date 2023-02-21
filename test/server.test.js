const { beforeEach, afterEach, test } = require('tap')
const { createDecoder } = require('fast-jwt')

const buildServer = require('../src/server')

const demoUser2 = { username: 'demo2', password: 'demo2' }
const demoUser3 = { username: 'demo3', password: 'demo3' }

let token
let token2
let token3

let userId

beforeEach(async (t) => {
  t.context.server = await buildServer({
    secret: 'fastiftw',
    mongoOptions: {
      url: 'mongodb://localhost:27017/fastiftw'
    }
  })
})

afterEach(async (t) => {
  t.teardown(() => t.context.server.close())
})

test(`reset database`, async (t) => {
  const resp = await t.context.server.inject()
    .post('/api/v1/dev/reset')
    .payload([
      'accounts',
      'posts'
    ])

  t.equal(resp.statusCode, 200, 'returns 200')
})

test(`register demo user2`, async (t) => {
  const resp = await t.context.server.inject()
    .post('/api/v1/register')
    .payload(demoUser2)

  t.equal(resp.statusCode, 200, 'returns 200')
})

test(`login with demo2`, async (t) => {
  const resp = await t.context.server.inject()
    .post('/api/v1/login')
    .payload(demoUser2)

  token3 = resp.json().result

  t.equal(resp.statusCode, 200, 'returns 200')
})

test(`register demo user3`, async (t) => {
  const resp = await t.context.server.inject()
    .post('/api/v1/register')
    .payload(demoUser3)

  t.equal(resp.statusCode, 200, 'returns 200')
})

test(`login with demo3`, async (t) => {
  const resp = await t.context.server.inject()
    .post('/api/v1/login')
    .payload(demoUser3)

  token = resp.json().result

  t.equal(resp.statusCode, 200, 'returns 200')
})

test(`check default route`, async (t) => {
  const resp = await t.context.server.inject()
    .get('/')

  t.equal(resp.statusCode, 200, 'returns 200')
})

test(`posts collection`, async () => {
  let postId

  test(`create a new post without token`, async (t) => {
    const resp = await t.context.server.inject()
      .post('/api/v1/posts')

    t.equal(resp.statusCode, 401, 'returns 401')
  })

  test(`create a new post`, async (t) => {
    const resp = await t.context.server.inject()
      .post('/api/v1/posts')
      .headers({ authorization: 'Bearer ' + token })
      .payload({ title: 'this is a post title' })

    const { result } = resp.json()

    postId = result.insertedId

    t.equal(resp.statusCode, 200, 'returns 200')
  })

  test(`get my posts`, async (t) => {
    const resp = await t.context.server.inject()
      .get('/api/v1/posts')
      .headers({ authorization: 'Bearer ' + token })

    const { result } = resp.json()

    t.equal(result.length, 1, 'returns posts length equal to 1')
  })

  test(`get post by post id`, async (t) => {
    const resp = await t.context.server.inject()
      .get('/api/v1/posts/' + postId)
      .headers({ authorization: 'Bearer ' + token })

    const { result } = resp.json()

    t.equal(result._id === postId, true)
  })

  test(`update post by post id`, async (t) => {
    const resp = await t.context.server.inject()
      .put('/api/v1/posts/' + postId)
      .headers({ authorization: 'Bearer ' + token })
      .payload({ title: 'this is a new post title' })

    const { result } = resp.json()

    t.equal(result.modifiedCount, 1)
  })

  test(`remove post by post id`, async (t) => {
    const resp = await t.context.server.inject()
      .delete('/api/v1/posts/' + postId)
      .headers({ authorization: 'Bearer ' + token })

    const { result } = resp.json()

    t.equal(result.deletedCount, 1)
  })

  // failed

  test(`get post by post id with wrong user`, async (t) => {
    const resp = await t.context.server.inject()
      .get('/api/v1/posts/' + postId)
      .headers({ authorization: 'Bearer ' + token3 })

    t.equal(resp.statusCode, 500, 'returns 500')
  })

  test(`update post by post id with wrong user`, async (t) => {
    const resp = await t.context.server.inject()
      .put('/api/v1/posts/' + postId)
      .headers({ authorization: 'Bearer ' + token3 })
      .payload({ title: 'this is a new post title' })

    t.equal(resp.statusCode, 500, 'returns 500')
  })

  test(`remove post by post id with wrong user`, async (t) => {
    const resp = await t.context.server.inject()
      .delete('/api/v1/posts/' + postId)
      .headers({ authorization: 'Bearer ' + token3 })

    t.equal(resp.statusCode, 500, 'returns 500')
  })
})
