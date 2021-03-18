const chai = require('chai')
const { expect } = require('chai')
const chaiBytes = require('chai-bytes')
chai.use(chaiBytes);

const {
  BCP,
  BCP_TYPE_GENERIC,
  BCP_TYPE_TEXT,
  BCP_TYPE_AUDIO,
  BCP_TYPE_IMAGE,
  BCP_SRC_NONE,
  BCP_SRC_TXID,
  BCP_SRC_IPFS,
  BCP_SRC_URL,
  BCP_SRC_ADDR,
} = require('../lib/index')

const mocha = require('mocha')
const { BN } = require ('bignumber.js')

const { parserTests, creatorTests } = require('./tests.spec')

describe('CREATOR', () => {
  const bcp = new BCP()
  // simple on-chain test
  expect(() => bcp.createChainText(creatorTests.text)).to.not.throw()
  let opReturn = bcp.createChainText('Hello BCP')
  expect(opReturn).to.equalBytes(Buffer.from(parserTests.text, 'hex'))

  // audio file on IPFS - Qm... hash on IPFS
  expect(() => bcp.createAudio(BCP_SRC_IPFS, creatorTests.ipfs)).to.not.throw()
  opReturn = bcp.createAudio(BCP_SRC_IPFS, creatorTests.ipfs)
  expect(opReturn).to.equalBytes(Buffer.from(parserTests.ipfs, 'hex'))

  // image on HTTP URL
  expect(() => bcp.createImage(BCP_SRC_URL, creatorTests.url)).to.not.throw()
  opReturn = bcp.createImage(BCP_SRC_URL, creatorTests.url)
  expect(opReturn).to.equalBytes(Buffer.from(parserTests.url, 'hex'))

  // SIP URI for voice call
  expect(() => bcp.createAudio(BCP_SRC_URL, creatorTests.sip)).to.not.throw()
  opReturn = bcp.createAudio(BCP_SRC_URL, creatorTests.sip)
  expect(opReturn).to.equalBytes(Buffer.from(parserTests.sip, 'hex'))

  // SLP for changable objects state
  expect(() => bcp.createState(creatorTests.slp)).to.not.throw()
  opReturn = bcp.createState(creatorTests.slp)
  expect(opReturn).to.equalBytes(Buffer.from(parserTests.slp, 'hex'))
})
