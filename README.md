# BlockChain Payloads (BCP)

Immutable pointers to digital data, saved on the BCH blockchain

## Objectives

There are already a lot of projects, working with NFT on BCH blockchain (SLP
tokens), but they all choose their own way to connect these tokens to the related
content.

it is difficult for the wallets and exchanges developers to support these projects, because it requires individual changes for every additional project.

With the increased usage of NFT tokens on the BCH blockchain, there is a need to unify the way these tokens connect to the tokenized data - audio, video, images etc.

Current repository contains **bcp-js** JavaScript Library for building transactions for the [BlockChain Payloads (BCP) Protocol](docs/bcp-protocol-spec.md).

## BCP Protocol Reference

This library is a reference code for the [BlockChain Payloads (BCP) Protocol](docs/bcp-protocol-spec.md). The [examples in this repository](examples/) contain the full code necessary for the BCP message types and sources described in the protocol specification. Please reference these examples when building or testing your own applications.


## Used libraries and services

* [bignumber.js](https://mikemcl.github.io/bignumber.js/) - A JavaScript library for arbitrary-precision arithmetic

## Installation

* for *node.js*

```sh
npm install bcp-js
```

* for browser

```html
<script src="https://unpkg.com/bcp-js"></script>
```

for a specific version:

```html
<script src="https://unpkg.com/bcp-js@1.0.1/dist/bcp.min.js"></script>
```


## Development

The easiest way is to download the library sources from the GitHub repository and rebuild them for your project:

```sh
git clone https://github.com/zh/bcp-js.git
cd bcp-js
npm install
npm run build
```

## Testing

There are some basic tests implemented. More will be added.

```sh
npm test
```

## Usage

### Library instantiation

```js
const { BCP } = require('bcp-js')
const bcp = new BCP()
```

### BCP types and sources

The library provides definitions for all BCP types and sources, mentiobed in the [protocol specification]((docs/bcp-protocol-spec.md)):

* **1.) BCP Types**

 * *`BCP_TYPE_GENERIC`* - Generic type. Can be any content
 * *`BCP_TYPE_TEXT`* - Simple string (UTF-8 encoded)
 * *`BCP_TYPE_IMAGE`* - *.png*, *.gif* etc. images
 * *`BCP_TYPE_AUDIO`* - *.mp3*, *.ogg* etc. audio files
 * *`BCP_TYPE_VIDEO`* - *.mpv*, *.mp4* etc. video files
 * *`BCP_TYPE_JSON`* - JSON formated data - *still not implemented*
 * *`BCP_TYPE_WAIFU`* - WAIFU type NFTs (points to the tokenId)

* **2.) BCP Sources**

 * *`BCP_SRC_NONE`* - data is inside the *OP_RETURN* itself
 * *`BCP_SRC_TXID`* - on-chain data, represented by transaction ID
 * *`BCP_SRC_URL`* - URL, standart HTTP (web) location
 * *`BCP_SRC_IPFS`* - IPFS, represented by IPFS hash of the data

 To use these definitions you need to import them in your sources:
 
 ```js
 const { BCP, BCP_TYPE_IMAGE, BCP_SRC_IPFS } = require('bcp-js')
 ```

### Methods for BCP creation

* *`create(type, source, data)`* - Need to explicitly specify BCP type and source. All methods below using this method.  
* *`createChainText(data)`* - on-chain string data, inside the *OP_RETURN* itself
* *`createText(source, data)`* - off-chain UFT-8 encoded string (is this needed?)
* *`createWaifu(data)`* - points to *WAIFU* type NFT tokenId
* *`createAudio(source, data)`* - points to audio file (*.mp3*, *.ogg* etc.)
* *`createImage(source, data)`* - points to an image file (*.png*, *.gif* etc.)
* *`createFromString(str)`* - automatically detects source from the string - URL, IPFS etc.

#### Create BCP for a simple blockchain saved text

Simple text message, similar to the `memo.cash` ones (text is in the *OP_RETURN* itself):

```js
const opReturn = bcp.createChainText('Hello BCP')
console.log(opReturn.toString('hex')) // 6a0442435000010201010948656c6c6f20424350
```

#### Create BCP for an audio file on  IPFS

Short *.mp3* file with rain drops, hosted on IPFS - BCP points to the IPFS hash

Use a general method, which allow BCP type argument:

```js
const { BCP_TYPE_AUDIO, BCP_SRC_IPFS } = require('bcp-js')
const ipfsHash = 'QmZmqLskJmghru919cvU4qSy3L5vc1S2JdzsUXrM17ZqT9'
const opReturn = bcp.create(BCP_TYPE_AUDIO, BCP_SRC_IPFS, ipfsHash)
console.log(opReturn.toString('hex')) // 6a0442435000010401042e516d5a6d714c736b4a6d6768727539313963765534715379334c3576633153324a647a735558724d31375a715439
```

or use specific method for the given BCP type

```js
const ipfsHash = 'QmZmqLskJmghru919cvU4qSy3L5vc1S2JdzsUXrM17ZqT9'
const opReturn = bcp.createAudio(BCP_SRC_IPFS, ipfsHash)
```

#### Create BCP to a WAIFU type NFT

[WAIFU type of NFTs](https://waifu.camp/) became pretty popular recently, so they got special type in the library. They are SLP NFT children tokens, originating from the same NFT group, with images saved to a specific URL (same for all tokens, image file name is the tokenId). There is nothing about the images URL in the tokens itselves. In order to be viewed, the server URL should be provided separately for every NFT group. BCP will contain only the tokenId of the already created NFT child.

```js
const waifuId = 'ec8a11c0d3b0c2c484e5abdd28af70d66206a5cfbf82d888729c53fcacf8d712' // tokenId
const opReturn = bcp.createWaifu(waifuId)
console.log(opReturn.toString('hex')) // 6a04424350000164010220ec8a11c0d3b0c2c484e5abdd28af70d66206a5cfbf82d888729c53fcacf8d712
```

### Methods for parsing BCP

* *`parse(payload)`* - parse *OP_RETURN* with BCP and return JS object

#### Parse IPFS save audio file

Using the audio-file on IPFS *OP_RETURN* from the creation example above.

```js
const op = '6a0442435000010401042e516d5a6d714c736b4a6d6768727539313963765534715379334c3576633153324a647a735558724d31375a715439'
parsed = bcp.parse(op)
console.log(JSON.stringify(parsed, null,2))
```
```js
{
  "type": 4,   // BCP_TYPE_AUDIO
  "source": 4, // BCP_SOURCE_IPFS
  "data": {
    "hash": {  // QmZmqLskJmghru919cvU4qSy3L5vc1S2JdzsUXrM17ZqT9
      "type": "Buffer",
      "data": [
      ...

```

You can see more usage examples in the [examples directory](examples/).

## Future plans

SLP on BCH blockchain providing pretty mature infrastrucure for working with NFT tokens - grouping (parent+children), indexing etc. There is no need to invite the same for the BCPs. Just **create NFT with documentUri pointing to BCP** and all these services can be used for working with the data, pointed by BCP. This will also provide ownership prove of the digital content.

There is already a [proposal for adding several OP_RETURN data to one transaction](https://bitcoincashresearch.org/t/multiple-op-returns-this-time-for-real/315). This will make connecting NFT to the BCP pointed data even easier - one *OP_RETURN* for the SLP and one for the BCP!

Some real code for create/view NFTs with BCP pointed data will be added.

Hope more wallets and exchanges developers agree on the current proposal, so more implementations will be done - other languages etc.

## Donations

Every amount of BCH will help the future development

* BCH: `bitcoincash:qq3t709lskk7tpg5nl8xdfvu8rx4v66ys5cwlxw3ac`

![BCH address](https://gateway.pinata.cloud/ipfs/QmPz1Knaxj5UhJ4jrQjpr6LK9uA5em26NVmC2eX7W4D29D)