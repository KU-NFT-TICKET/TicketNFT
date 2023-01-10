const IPFS = require('ipfs-http-client')
const ipfs = new IPFS({host: 'ipfs.infura.io', port: 5001, protocal: 'https'})

export default ipfs