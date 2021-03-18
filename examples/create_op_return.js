const {
  BCP,
  BCP_SRC_URL,
  BCP_SRC_IPFS
} = require('../dist/bcp.js')

function createBCP () {
  try {
    const ipfsHash = 'QmZmqLskJmghru919cvU4qSy3L5vc1S2JdzsUXrM17ZqT9'
    const url = 'http://example.com/image.png'
    const sipUri = 'sip:john@example.com'
    const slpAddress = 'simpleledger:qq2fg599ysqvfefr2ur0z34n2dk6f0aszg5pskpe06'
    const bcp = new BCP()

    // Simple text saved to the blockchain
    let opReturn = bcp.createChainText('Hello BCP')
    console.log(`OP_RETURN: ${JSON.stringify(opReturn.toString('hex'), null, 2)}`)
    let parsed = bcp.parse(opReturn)
    console.log(`text: ${JSON.stringify(parsed.data.toString(), null, 2)}`)

    // .mp3 file on IPFS
    opReturn = bcp.createAudio(BCP_SRC_IPFS, ipfsHash)
    console.log(`OP_RETURN: ${JSON.stringify(opReturn.toString('hex'), null, 2)}`)
    parsed = bcp.parse(opReturn)
    console.log(`hash: ${JSON.stringify(parsed.data.hash.toString(), null, 2)}`)

    // Image on the usual HTTP URL
    opReturn = bcp.createImage(BCP_SRC_URL, url)
    console.log(`OP_RETURN: ${JSON.stringify(opReturn.toString('hex'), null, 2)}`)
    parsed = bcp.parse(opReturn)
    console.log(`url: ${JSON.stringify(parsed.data.url.toString(), null, 2)}`)

    // Same image, BCP automatically detected
    opReturn = bcp.createFromString(ipfsHash)
    console.log(`OP_RETURN: ${JSON.stringify(opReturn.toString('hex'), null, 2)}`)
    parsed = bcp.parse(opReturn)
    console.log(`url: ${JSON.stringify(parsed.data.hash.toString(), null, 2)}`)

    // SIP URI for voice call
    opReturn = bcp.createAudio(BCP_SRC_URL, sipUri)
    console.log(`OP_RETURN: ${JSON.stringify(opReturn.toString('hex'), null, 2)}`)
    parsed = bcp.parse(opReturn)
    console.log(`sip: ${JSON.stringify(parsed.data.url.toString(), null, 2)}`)

    // SLP address for implementing changable objects (keeping the state etc.)
    opReturn = bcp.createState(slpAddress)
    console.log(`OP_RETURN: ${JSON.stringify(opReturn.toString('hex'), null, 2)}`)
    parsed = bcp.parse(opReturn)
    console.log(`address: ${JSON.stringify(parsed.data.address.toString(), null, 2)}`)
  } catch (error) {
    console.error('error in createBCP: ', error)
  }
}

createBCP()
