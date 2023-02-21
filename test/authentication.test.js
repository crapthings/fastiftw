const { beforeEach, afterEach, test } = require('tap')
const { createDecoder } = require('fast-jwt')

const buildServer = require('../src/server')

const demoUser = { username: 'demo1', password: 'demo1' }

exports.demoUser = demoUser

beforeEach(async (t) => {
  t.context.server = await buildServer()
})

afterEach(async (t) => {
  t.teardown(() => t.context.server.close())
})

test(`reset database`, async (t) => {
  const resp = await t.context.server.inject()
    .post('/api/v1/dev/reset')
    .payload(['accounts'])

  t.equal(resp.statusCode, 200, `returns 200`)
})

test(`register without body`, async (t) => {
  const resp = await t.context.server.inject()
    .post('/api/v1/register')

  t.equal(resp.statusCode, 400, `returns 400`)
})

test(`register without username field`, async (t) => {
  const resp = await t.context.server.inject()
    .post('/api/v1/register')
    .payload({ password: demoUser.username })

  t.equal(resp.statusCode, 400, `returns 400`)
})

test(`register without password field`, async (t) => {
  const resp = await t.context.server.inject()
    .post('/api/v1/register')
    .payload({ username: demoUser.password })

  t.equal(resp.statusCode, 400, `returns 400`)
})

test(`register demo user`, async (t) => {
  const resp = await t.context.server.inject()
    .post('/api/v1/register')
    .payload(demoUser)

  t.equal(resp.statusCode, 200, `returns 200`)
})

test(`register demo user twice`, async (t) => {
  const resp = await t.context.server.inject()
    .post('/api/v1/register')
    .payload(demoUser)

  t.equal(resp.statusCode, 500, `returns 500`)
})

test(`login with empty body`, async (t) => {
  const resp = await t.context.server.inject()
    .post('/api/v1/login')

  t.equal(resp.statusCode, 400)
})

test(`login without username field`, async (t) => {
  const resp = await t.context.server.inject()
    .post('/api/v1/login')
    .payload({ password: demoUser.password })

  t.equal(resp.statusCode, 400)
})

test(`login without password field`, async (t) => {
  const resp = await t.context.server.inject()
    .post('/api/v1/login')
    .payload({ username: demoUser.username })

  t.equal(resp.statusCode, 400)
})

test(`login with wrong user`, async (t) => {
  const resp = await t.context.server.inject()
    .post('/api/v1/login')
    .payload({ username: 'failed', password: 'failed' })

  t.equal(resp.statusCode, 500)
})

test(`login with wrong pwd`, async (t) => {
  const resp = await t.context.server.inject()
    .post('/api/v1/login')
    .payload({ ...demoUser, password: 'wrong', wtf: true })

  t.equal(resp.statusCode, 500)
})

test(`login with demo user`, async (t) => {
  const resp = await t.context.server.inject()
    .post('/api/v1/login')
    .payload(demoUser)

  const { result } = resp.json()

  const user = createDecoder()(result)

  t.equal(user.username === demoUser.username, true)
})
