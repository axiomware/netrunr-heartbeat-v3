/*
 * Example program - Detect Netrunr Heart beat signal - run continuous
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

// Main function
async function main () {
  console.log('Collecting heartbeat data....')
  gNetrunrClient.on('heartbeat', gwHeartbeatHandler)
  await gNetrunrClient.init(gHostFE, gPortFE, gOptionsFE, gTopicPrefixFE, gTLS)
}

// Heartbeat handler
async function gwHeartbeatHandler (hbtData) {
  console.log(`[${dateTime(hbtData.date)}][${hbtData.id.toUpperCase()}][${hbtData.rcount}]`)
}

// Convert date from unix format. Input in milliseconds
function dateTime (s) {
  var d = new Date(s)
  var localISOTime = new Date(d.getTime() - d.getTimezoneOffset() * 60 * 1000).toISOString().slice(0, -1)
  return localISOTime
}
