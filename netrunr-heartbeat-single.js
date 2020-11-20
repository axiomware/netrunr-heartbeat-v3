/*
 * Example program - Detect Netrunr Heart beat signal
 *
 * Copyright(C) 2020 Axiomware Systems Inc..
 * https://www.axiomware.com/
 *
 * Licensed under the MIT license <LICENSE-MIT or http://opensource.org/licenses/MIT>
 */

'use strict'

const minimist = require('minimist')
const gapiV3Lib = require('gapi-v3-sdk')
const fs = require('fs')
const path = require('path')

process.stdin.resume() // so the program will not close instantly

process.on('exit', function (err) { // On exit handler
  console.log('Goodbye!')
})

process.on('unhandledRejection', (reason, p) => { // Unhandled promise rejections.
  console.log('Unhandled Rejection at: Promise', p)
  // application specific handling here
})

process.on('uncaughtException', (reason, p) => { // Unhandled exceptions
  console.log(p, 'reason:', reason)
  // application specific handling here
})

const args = minimist(process.argv.slice(2), {
  string: ['host', // MQTT broker IP addr
    'port', // MQTT broker port
    'prefix', // Topic prefix
    'ca-filename', // Root CA file name
    'key-filename', // client key
    'crt-filename' // client certificate
  ],
  boolean: ['tls'], // true -> if TLS is needed
  alias: { h: 'host', p: 'port', t: 'prefix' },
  default: {
    host: '192.168.8.1',
    port: '1883',
    prefix: 'netrunrfe/',
    tls: false,
    'ca-filename': '',
    'key-filename': '',
    'crt-filename': ''
  }
})

var CA = null
var KEY = null
var CRT = null

var gHostFE = args.host
var gPortFE = args.port
var gTLS = args.tls
if (gTLS) {
  if (args['ca-filename']) {
    const caFQN = path.isAbsolute(args['ca-filename']) ? args['ca-filename'] : path.join(__dirname, args['ca-filename'])
    try {
      CA = fs.readFileSync(caFQN)
    } catch (err) {
      console.log(`Error reading CA file [${caFQN}]`)
    }
  }
  if (args['key-filename']) {
    const keyFQN = path.isAbsolute(args['key-filename']) ? args['key-filename'] : path.join(__dirname, args['key-filename'])
    try {
      KEY = fs.readFileSync(keyFQN)
    } catch (err) {
      console.log(`Error reading KEY file [${keyFQN}]`)
    }
  }
  if (args['crt-filename']) {
    const crtFQN = path.isAbsolute(args['crt-filename']) ? args['crt-filename'] : path.join(__dirname, args['crt-filename'])
    try {
      CRT = fs.readFileSync(crtFQN)
    } catch (err) {
      console.log(`Error reading CRT file [${crtFQN}]`)
    }
  }
}

var gOptionsFE = {
  username: '',
  password: '',
  key: KEY,
  cert: CRT,
  ca: CA,
  rejectUnauthorized: false
}

var gTopicPrefixFE = args.prefix

const gNetrunrClient = new gapiV3Lib.GapiClient()
main()

async function main () {
  await gNetrunrClient.init(gHostFE, gPortFE, gOptionsFE, gTopicPrefixFE, gTLS)

  console.log('Collecting heartbeat data for 5 seconds....')
  await sleep(5000)
  const gwlist = gNetrunrClient.listGW()

  console.table(gwlist.map(gwDisp))
  process.exit()
}

// Select fields for table display
function gwDisp (gwInfo) {
  return {
    date: new Date(gwInfo.date),
    id: gwInfo.id.toUpperCase(),
    rcount: gwInfo.rcount,
    online: gwInfo.online
  }
}

// Delay function with delay in milliseconds
function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
