require('dotenv').config()

const PORT = process.env.PORT || 3000

const buildServer = require('./server')

;(async function startServer () {
  const serverOptions = {
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty'
      }
    }
  }

  const server = await buildServer({
    serverOptions,
  })

  server.listen({ port: PORT }, (err, address) => {
    if (err) {
      server.log.error(err)
      process.exit(1)
    } else {
      console.log('fastiftw is running at', PORT)
    }
  })
})()
