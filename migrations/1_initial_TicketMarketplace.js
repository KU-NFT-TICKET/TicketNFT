const TicketMarketplace = artifacts.require('./TicketMarketplace')

module.exports = async (deployer, network, [owner]) => {
    await deployer.deploy(TicketMarketplace)
}