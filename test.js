'use strict'

var test = require('tape')
var net = require('net')
var http = require('http')
var consumeHead = require('./')

test('request', function (t) {
  t.plan(8)

  var server = net.createServer(function (socket) {
    consumeHead(socket, function (err, head) {
      t.error(err)
      t.equal(head.method, 'GET')
      t.equal(head.url, '/')
      t.deepEqual(head.version, { major: 1, minor: 1 })
      t.equal(head.headers['host'], 'localhost:' + server.address().port)
      t.equal(head.headers['x-foo'], 'bar')

      socket.on('data', function (chunk) {
        t.equal(chunk.toString(), 'Hello World')
        socket.end('HTTP/1.1 200 OK\r\n\r\n')
      })
    })
  })

  server.listen(function () {
    var port = server.address().port
    var req = http.request({ port: port, headers: { 'X-Foo': 'bar' } }, function (res) {
      server.close()
      t.equal(res.statusCode, 200)
    })
    req.write('Hello World')
  })
})

test('response', function (t) {
  var server = http.createServer(function (req, res) {
    res.setHeader('X-Foo', 'bar')
    res.end('Hello World')
  })

  server.listen(function () {
    var port = server.address().port
    var socket = net.connect({ port: port })
    socket.write('GET / HTTP/1.1\r\n\r\n')

    consumeHead(socket, function (err, head) {
      t.error(err)
      t.deepEqual(head.version, { major: 1, minor: 1 })
      t.equal(head.statusCode, 200)
      t.equal(head.statusMessage, 'OK')
      t.equal(head.headers['connection'], 'keep-alive')
      t.equal(head.headers['x-foo'], 'bar')

      socket.on('data', function (chunk) {
        t.equal(chunk.toString(), 'Hello World')
        socket.end()
        server.close()
        t.end()
      })
    })
  })
})
