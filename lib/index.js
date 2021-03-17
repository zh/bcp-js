const BN = require('bignumber.js')

const OP_0 = 0x00
const OP_RETURN = 0x6a
const OP_PUSHDATA1 = 0x4c
const OP_PUSHDATA2 = 0x4d
const OP_PUSHDATA4 = 0x4e

const BCP_TYPE_GENERIC = 0x01
const BCP_TYPE_TEXT = 0x02
const BCP_TYPE_IMAGE = 0x03
const BCP_TYPE_AUDIO = 0x04
const BCP_TYPE_VIDEO = 0x05
const BCP_TYPE_JSON = 0x06
const BCP_TYPE_WAIFU = 0x64

const BCP_SRC_NONE = 0x01
const BCP_SRC_TXID = 0x02
const BCP_SRC_URL = 0x03
const BCP_SRC_IPFS = 0x04
const BCP_SRC_ADDR = 0x05

function pushdata(buf) {
  if (buf.length === 0) {
    return Buffer.from([0x4c, 0x00])
  } else if (buf.length < 0x4e) {
    return Buffer.concat([Buffer.from([buf.length]), buf])
  } else if (buf.length < 0xff) {
    return Buffer.concat([Buffer.from([0x4c, buf.length]), buf])
  } else if (buf.length < 0xffff) {
    const tmp = Buffer.allocUnsafe(2)
    tmp.writeUInt16LE(buf.length, 0)
    return Buffer.concat([Buffer.from([0x4d]), tmp, buf])
  } else if (buf.length < 0xffffffff) {
    const tmp = Buffer.allocUnsafe(4)
    tmp.writeUInt32LE(buf.length, 0)
    return Buffer.concat([Buffer.from([0x4e]), tmp, buf])
  }
  throw new Error('does not support bigger pushes yet')
}

function BNToInt64BE(bn) {
  if (!bn.isInteger()) throw new Error('bn not an integer')
  if (!bn.isPositive()) throw new Error('bn not positive integer')

  const h = bn.toString(16)
  if (h.length > 16) throw new Error('bn outside of range')

  return Buffer.from(h.padStart(16, '0'), 'hex')
}

const PARSE_CHECK = (v, str) => {
  if (v) throw Error(str)
}

const checkValidTokenId = tokenId => tokenId.length === 32

const validPayload = (source, data) => {
  if (typeof data === 'string') {
    if (source === BCP_SRC_TXID) return Buffer.from(data, 'hex')
    else if ([BCP_SRC_NONE, BCP_SRC_URL, BCP_SRC_IPFS, BCP_SRC_ADDR].includes(source)) return Buffer.from(data)
  }
  return data
}

class BCP {
  constructor(payload) {
    this.TYPES = [
      BCP_TYPE_GENERIC,
      BCP_TYPE_TEXT,
      BCP_TYPE_IMAGE,
      BCP_TYPE_AUDIO,
      BCP_TYPE_VIDEO,
      BCP_TYPE_JSON,
      BCP_TYPE_WAIFU
    ]
    this.SOURCES = [
      BCP_SRC_NONE,
      BCP_SRC_TXID,
      BCP_SRC_URL,
      BCP_SRC_IPFS,
      BCP_SRC_ADDR
    ]
    this.payloadType = 0x0
    this.payloadSource = 0x0
    this.payloadData = {}
    this.itObj = Buffer.from('')
    this.it = 0 // // position in itObj
    this.cit = 0 // // position in chunks
    this.chunks = []
  }

  CHECK_NEXT() {
    ++this.cit
    PARSE_CHECK(this.cit === this.chunks.length, 'parsing ended early')
    this.it = 0
    this.itObj = this.chunks[this.cit]
  }

  extractU8() {
    const r = this.itObj.readUInt8(this.it)
    this.it += 1
    return new BN(r)
  }

  extractU16() {
    const r = this.itObj.readUInt16LE(this.it)
    this.it += 2
    return new BN(r)
  }

  extractU32() {
    const r = this.itObj.readUInt32LE(this.it)
    this.it += 4
    return new BN(r)
  }

  extractU64() {
    const r1 = this.itObj.readUInt32LE(this.it)
    this.it += 4

    const r2 = this.itObj.readUInt32LE(this.it)
    this.it += 4

    return new BN(r2).multipliedBy(2 ** 32).plus(r1)
  }

  bufferToBN() {
    if (this.itObj.length === 1) return this.extractU8()
    if (this.itObj.length === 2) return this.extractU16()
    if (this.itObj.length === 4) return this.extractU32()
    if (this.itObj.length === 8) return this.extractU64()
    throw new Error('extraction of number from buffer failed')
  }

  extractPushdata() {
    if (this.it === this.itObj.length) return -1

    const cnt = this.extractU8().toNumber()
    if (cnt > OP_0 && cnt < OP_PUSHDATA1) {
      if (this.it + cnt > this.itObj.length) {
        --this.it
        return -1
      }
      return cnt
    } else if (cnt === OP_PUSHDATA1) {
      if (this.it + 1 >= this.itObj.length) {
        --this.it
        return -1
      }
      return this.extractU8().toNumber()
    } else if (cnt === OP_PUSHDATA2) {
      if (this.it + 2 >= this.itObj.length) {
        --this.it
        return -1
      }
      return this.extractU16().toNumber()
    } else if (cnt === OP_PUSHDATA4) {
      if (this.it + 4 >= this.itObj.length) {
        --this.it
        return -1
      }
      return this.extractU32().toNumber()
    }

    // other opcodes not allowed
    --this.it
    return -1
  }

  parse(payload) {
    if (typeof payload === 'string') this.itObj = Buffer.from(payload, 'hex')
    else this.itObj = payload // Buffer
    this.it = 0 // position in this.itObj
    this.chunks = [] // pushdata chunks
    this.cit = 0 // position in chinks
    PARSE_CHECK(this.itObj.length === 0, 'payload cannot be empty')
    PARSE_CHECK(this.itObj[this.it] !== OP_RETURN, 'payload not op_return')
    ++this.it

    for (let len = this.extractPushdata(); len >= 0; len = this.extractPushdata()) {
      const buf = this.itObj.slice(this.it, this.it + len)
      PARSE_CHECK(this.it + len > this.itObj.length, 'pushdata data extraction failed')

      this.it += len
      this.chunks.push(buf)

      if (this.chunks.length === 1) {
        const lokadIdStr = this.chunks[0]
        PARSE_CHECK(lokadIdStr.length !== 4, 'lokad id wrong size')
        PARSE_CHECK(
          lokadIdStr[0] !== 'B'.charCodeAt(0) ||
            lokadIdStr[1] !== 'C'.charCodeAt(0) ||
            lokadIdStr[2] !== 'P'.charCodeAt(0) ||
            lokadIdStr[3] !== 0x00, 'BCP not in first chunk')
      }
    }

    PARSE_CHECK(this.it !== this.itObj.length, 'trailing data')
    PARSE_CHECK(this.chunks.length === 0, 'chunks empty')
    PARSE_CHECK(this.chunks.length < 4, 'wrong number of chunks')
    this.CHECK_NEXT()

    // Payload Type
    const payloadTypeBuf = this.itObj.reverse()
    PARSE_CHECK(payloadTypeBuf.length !== 1, 'payload_type string length must be 1')

    this.payloadType = this.bufferToBN().toNumber()
    PARSE_CHECK(!this.TYPES.includes(this.payloadType), 'invalid payload_type')
    this.CHECK_NEXT()

    // Payload Source
    const payloadSourceBuf = this.itObj.reverse()
    PARSE_CHECK(payloadSourceBuf.length !== 1, 'payload_string string length must be 1')

    this.payloadSource = this.bufferToBN().toNumber()
    PARSE_CHECK(!this.SOURCES.includes(this.payloadSource), 'invalid payload_source')
    this.CHECK_NEXT()

    const sourceDataBuf = this.itObj
    this.payloadData = sourceDataBuf

    // tx source (waifu etc.): payload is txid
    if (this.payloadSource === BCP_SRC_TXID) {
      PARSE_CHECK(!checkValidTokenId(sourceDataBuf), 'invalid TxID')
      this.payloadData = { tokenId: sourceDataBuf }
    }

    if (this.payloadSource === BCP_SRC_URL) this.payloadData = { url: sourceDataBuf }
    if (this.payloadSource === BCP_SRC_ADDR) this.payloadData = { address: sourceDataBuf }

    if (this.payloadSource === BCP_SRC_IPFS) {
      PARSE_CHECK(sourceDataBuf.length !== 46, 'IPFS hash length must be 46')
      PARSE_CHECK(!sourceDataBuf.toString().startsWith('Qm'), 'invalid IPFS hash (Qm...)')
      this.payloadData = { hash: sourceDataBuf }
    }

    // TODO: add more src checks
    return {
      type: this.payloadType,
      source: this.payloadSource,
      data: this.payloadData
    }
  }

  create(type, source, data) {
    PARSE_CHECK(!this.TYPES.includes(type), 'invalid payload_type')
    PARSE_CHECK(!this.SOURCES.includes(source), 'invalid payload_source')

    const buf = Buffer.concat([
      Buffer.from([0x6a]), // OP_RETURN
      pushdata(Buffer.from('BCP\0')), // Lokad 00504342
      pushdata(Buffer.from([type])),
      pushdata(Buffer.from([source])),
      pushdata(validPayload(source, data))
    ])
    return buf
  }

  createWaifu(data) {
    return this.create(BCP_TYPE_WAIFU, BCP_SRC_TXID, data)
  }

  createAudio(source, data) {
    return this.create(BCP_TYPE_AUDIO, source, data)
  }

  createVideo(source, data) {
    return this.create(BCP_TYPE_VIDEO, source, data)
  }

  createImage(source, data) {
    return this.create(BCP_TYPE_IMAGE, source, data)
  }

  createText(source, data) {
    return this.create(BCP_TYPE_TEXT, source, data)
  }

  createChainText(data) {
    return this.create(BCP_TYPE_TEXT, BCP_SRC_NONE, data)
  }

  createState(address, type = BCP_TYPE_GENERIC) {
    return this.create(type, BCP_SRC_ADDR, address)
  }

  createFromString(str) {
    const type = BCP_TYPE_TEXT
    let source = BCP_SRC_NONE
    if (str.length === 46 && str.startsWith('Qm')) source = BCP_SRC_IPFS
    else if (checkValidTokenId(str)) source = BCP_SRC_TXID
    return this.create(type, source, str)
  }
}

module.exports = {
  BCP,
  BCP_TYPE_GENERIC,
  BCP_TYPE_TEXT,
  BCP_TYPE_IMAGE,
  BCP_TYPE_AUDIO,
  BCP_TYPE_VIDEO,
  BCP_TYPE_JSON,
  BCP_TYPE_WAIFU,
  BCP_SRC_NONE,
  BCP_SRC_TXID,
  BCP_SRC_URL,
  BCP_SRC_IPFS,
  BCP_SRC_ADDR
}
