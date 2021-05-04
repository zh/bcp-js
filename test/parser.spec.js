const chai = require('chai')
const { expect } = require('chai')
const chaiBytes = require('chai-bytes')
chai.use(chaiBytes);

const {
  BCP,
  BCP_TYPE_GENERIC,
  BCP_TYPE_TEXT,
  BCP_TYPE_AUDIO,
  BCP_TYPE_VIDEO,
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

describe('PARSER', () => {
  const bcp = new BCP()
  // simple on-chain test
  expect(() => bcp.parse(parserTests.text)).to.not.throw()
  let p = bcp.parse(parserTests.text)
  expect(p.type).to.equal(BCP_TYPE_TEXT)
  expect(p.source).to.equal(BCP_SRC_NONE)
  expect(p.data).to.equalBytes(Buffer.from(creatorTests.text))

  // audio file on IPFS - Qm... hash on IPFS
  expect(() => bcp.parse(parserTests.ipfs)).to.not.throw()
  p = bcp.parse(parserTests.ipfs)
  expect(p.type).to.equal(BCP_TYPE_AUDIO)
  expect(p.source).to.equal(BCP_SRC_IPFS)
  expect(p.data.hash).to.equalBytes(Buffer.from(creatorTests.ipfs))

  // image on HTTP URL
  expect(() => bcp.parse(parserTests.url)).to.not.throw()
  p = bcp.parse(parserTests.url)
  expect(p.type).to.equal(BCP_TYPE_IMAGE)
  expect(p.source).to.equal(BCP_SRC_URL)
  expect(p.data.url).to.equalBytes(Buffer.from(creatorTests.url))

  // video on IPFS (URL source)
  expect(() => bcp.parse(parserTests.ipfsURL)).to.not.throw()
  p = bcp.parse(parserTests.ipfsURL)
  expect(p.type).to.equal(BCP_TYPE_VIDEO)
  expect(p.source).to.equal(BCP_SRC_URL)
  expect(p.data.url).to.equalBytes(Buffer.from(creatorTests.ipfsURL))
  parsedURL = JSON.parse(p.data.parsed.toString())
  expect(parsedURL).have.property('scheme').to.equal('ipfs')
  expect(parsedURL).have.property('authority').to.equal(creatorTests.ipfsURL.split('://')[1])

  // SIP URI for voice call
  expect(() => bcp.parse(parserTests.sip)).to.not.throw()
  p = bcp.parse(parserTests.sip)
  expect(p.type).to.equal(BCP_TYPE_AUDIO)
  expect(p.source).to.equal(BCP_SRC_URL)
  expect(p.data.url).to.equalBytes(Buffer.from(creatorTests.sip))

  // SLP address (changable objects state)
  expect(() => bcp.parse(parserTests.slp)).to.not.throw()
  p = bcp.parse(parserTests.slp)
  expect(p.type).to.equal(BCP_TYPE_GENERIC)
  expect(p.source).to.equal(BCP_SRC_ADDR)
  expect(p.data.address).to.equalBytes(Buffer.from(creatorTests.slp))
})
