var isArray = Array.isArray
var pull = require('pull-stream')
var ref = require('ssb-ref')

module.exports = function (gossip, config, server) {

  // populate peertable with configured seeds (mainly used in testing)
  var seeds = config.seeds

  ;(isArray(seeds)  ? seeds : [seeds]).filter(Boolean)
  .forEach(function (addr) { gossip.add(addr, 'seed') })

  // populate peertable with pub announcements on the feed
  pull(
    server.messagesByType({
      type: 'pub', live: true, keys: false
    }),
    pull.drain(function (msg) {
      if (!msg.content.address) return
      if (ref.isAddress(msg.content.address)) {
        // PATCH: only self will be connected to immediately, others will roll out slowly
        gossip.add(msg.content.address, msg.author === server.id ? 'self' : 'pub')
      }
    })
  )

  // populate peertable with announcements on the LAN multicast
  server.on('local', function (_peer) {
    gossip.add(_peer, 'local')
  })

}
