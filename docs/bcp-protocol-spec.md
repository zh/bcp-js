# BlockChain Payloads Protocol Specification
### Specification version: 0.1
### Date published: March 16, 2021
### Latest revision: March 18, 2021

## Author
Stoyan Zhekov

## Acknowledgements

- The [SWaP Protocol](https://github.com/vinarmani/swap-protocol/blob/master/swap-protocol-spec.md) by Vin Armani
- The [Media Sharing Protocol](https://github.com/Permissionless-Software-Foundation/specifications/blob/master/ps001-media-sharing.md) by Chris Troutner

# 1. Background

## 1.1 Introduction

With the increased usage of NFT tokens on the BCH blockchain, there is a need to unify the way these tokens connect to the tokenized data - audio, video, images etc.

The current proposal will allow wallets or exchanges developers to more easy integrate NFT tokens in their projects.


## 1.2 Summary

The following presents a simple protocol for creating immutable pointers to on-chain or off-chain digital data. These pointers can be used then independently or (because of the already existing SLP-related infrastructure - indexer etc.) in the NFT *documentUri* field.

The methods described in that proposal allows to:

* create unified data payload pointers, which can be saved to the BCH blockchain
* parse BCH blockchain save pointers and retrieving the data, they refer to

## 1.3 Requirements

The BCP Protocol was developed with the following requirements in mind:

* ***Non-Invasive.*** It should require no changes to the underlying Bitcoin Cash protocol.
* ***Extensible.*** The system should allow for new types and sources to be included as the network evolves

# 2. Protocol

This protocol specification describes the requirements for creating immutable pointers to on-chain or off-chain digital data. The *OP_RETURN* of a Bitcoin Cash transaction is used to point to the data payload, and to indicate:

* where that content is stored - on-chain (TxID) or off-chain (URL, IPFS)
* what type of content is this - multimedia (audio, video), images etc.
* some specific for the given content type additional data - URL, IPFS hash etc.

## 2.1 Protocol ID

Messages, related to the BCP protocol, are starting with unique 4-byte prefix referred to as the protocol identifier (or protocol ID). The format is following [Lokad 4-byte prefix guideline](https://github.com/bitcoincashorg/bitcoincash.org/blob/master/spec/op_return-prefix-guideline.md). The proposed protocol ID is **0x42435000** which can be represented as *'BCP\x00'*.

## 2.2 Payload

A Payload is a message consisting of structured metadata within a single *OP_RETURN* output message located at output index 0 of a transaction. The format for the metadata must be followed exactly in order to be considered valid. The structured metadata format allows for indexing and searching of the blockchain for active Payloads. The format of every payload is:

* ```OP_RETURN <lokad_id_int = 'BCP\x00'> <bcp_msg_type> <bcp_msg_source> <source_data_bytes>```

## 2.1 Payload Types

The BlockChain Payload (BCP) types are used to represent different kinds of content in the protocol. In any BCP *OP_RETURN* message, the BCP type is represented by the **required field** named ```bcp_msg_type```. There are currently the following BCP types:

 * `<bcp_msg_type = 0x01>`: Generic - can be any content
 * `<bcp_msg_type = 0x02>`: Text - simple string
 * `<bcp_msg_type = 0x03>`: Image - *.png*, *.gif* etc. images
 * `<bcp_msg_type = 0x04>`: Audio - *.mp3*, *.ogg* etc. audio files
 * `<bcp_msg_type = 0x05>`: Video - *.mpv*, *.mp4* etc. video files
 * `<bcp_msg_type = 0x06>`: JSON formated data
 * `<bcp_msg_type = 0x64>`: WAIFU type NFTs (points to the tokenId)

## 2.2 Payload Sources

The BlockChain Payload (BCP) sources are used to represent different save locations of the content in the protocol. In any BCP *OP_RETURN* message, the BCP source is represented by the **required field** named ```bcp_msg_source```. There are currently the following BCP sources:

* `<bcp_msg_source = 0x01>`: data is inside the *OP_RETURN* itself
* `<bcp_msg_source = 0x02>`: on-chain data, represented by transaction ID
* `<bcp_msg_source = 0x03>`: URL, standart HTTP (web) location
* `<bcp_msg_source = 0x04>`: IPFS, represented by IPFS hash of the data
* `<bcp_msg_source = 0x05>`: BCH or SLP address

## 2.3 Payload Data

The BlockChain Payload (BCP) data is used to represent additional data for the **BCP sources** in the protocol. In any BCP *OP_RETURN* message, the BCP payload data is represented by the **required field** named ```source_data_bytes```.

Payload data is specific for every different **BCP source**:

* `<bcp_msg_source = 0x01>`: **UTF-8 encoded** (aka 'clear text') data inside the *OP_RETURN* itseld
* `<bcp_msg_source = 0x02>`: TxID - 32 bytes transaction ID
* `<bcp_msg_source = 0x03>`: standart HTTP URL, starting with *'http://'* or *'https://'*
* `<bcp_msg_source = 0x04>`: 46 bytes **IPFS hash**, starting with *'Qm'*
* `<bcp_msg_source = 0x05>`: BCH (*bitcoincash:...*) or SLP (*simpleledger:...*) address

# 3. Process

## 3.1 Create BCP formated OP_RETURN

### 3.1.1 Simple text message

Simple text message can be stored in the blockchain with the following BCP pointer:

* ```OP_RETURN <lokad_id_int = 'BCP\x00'> <bcp_msg_type = 0x02> <bcp_msg_source = 0x01> <source_data_bytes = encoded_text_message>```

[BCP simple text message (ASM):](https://explorer.bitcoin.com/bch/tx/3828557b917b2aed92b98e875c82908044b0d90ec2f133cb022f4e2d8eecda0a)

```OP_RETURN 42435000 02 01 48656c6c6f20424350```

### 3.1.2 Audio file on IPFS

Short 2s audio file (rain drops), saved to IPFS can be referenced as:

* ```OP_RETURN <lokad_id_int = 'BCP\x00'> <bcp_msg_type = 0x04> <bcp_msg_source = 0x04> <source_data_bytes = ipfs_hash>```

[BCP audio file on IPFS (ASM):](https://explorer.bitcoin.com/bch/tx/bddb26bb00ef94a8a43361622dd3c4743386b9da01d702ed921fdf9bd4be4860)

```OP_RETURN 42435000 04 04 516d5a6d714c736b4a6d6768727539313963765534715379334c3576633153324a647a735558724d31375a715439```


## 3.2 Parse BCP formated OP_RETURN

### 3.2.1 Image file on web server

* ```6a0442435000010301031c687474703a2f2f6578616d706c652e636f6d2f696d6167652e706e67```

[BCP image file on web server (ASM)](https://explorer.bitcoin.com/bch/tx/dcb53d46771aa38dfdd0895b6416009d4b42c100513a8c62d24592599f3dcf57)

will be parsed to (ASM)

```OP_RETURN 42435000 03 03 687474703a2f2f6578616d706c652e636f6d2f696d6167652e706e67```

* ```OP_RETURN <lokad_id_int = 'BCP\x00'> <bcp_msg_type = 0x03> <bcp_msg_source = 0x03> <source_data_bytes = http://example.com/image.png>```

## Reference Implementations

The protocol is still under development. The only working implementation in the moment is the [bcp-js](https://github.com/zh/bcp-js) JavaScript library, so it will be used as a reference for the future implementations.

### Clients

None currently

### Libraries

[bcp-js](https://github.com/zh/bcp-js)
