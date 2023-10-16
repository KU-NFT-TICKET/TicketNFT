const Marketplace = artifacts.require('./TicketMarketplace')
const { expectRevert, BN } = require('@openzeppelin/test-helpers');
const assert = require('assert');
const { convertTokensToWei } = require('../utils/tokens')
const { toBN } = web3.utils;
const fs = require('fs');

contract('TicketMarketplace', ([contractDeployer, owner, creator, buyer, secondBuyer]) => {
    let marketplace;

    before(async () => {
        marketplace = await Marketplace.new({ from: contractDeployer })
    });

    // console.log('contractDeployer: ', contractDeployer)
    // console.log('owner: ', owner)
    // console.log('creator: ', creator)
    // console.log('buyer: ', buyer)
    // console.log('secondBuyer: ', secondBuyer)

    describe('marketplace + NFT deployment', async () => {
        it('Deploys the Marketplace + NFT  SC successfully.', async () => {
            // console.log('Address is ', marketplace.address)
            assert.notEqual(marketplace.address, '', 'Should not be empty');
            assert.notEqual(marketplace.address, 0x0, 'Should not be the 0x0 address');
            assert.notEqual(marketplace.address, null, 'Should not be null');
            assert.notEqual(marketplace.address, undefined, 'Should not be undefined');
        })

        it('The ticketnft SC should have a name and a symbol.', async () => {
            const name = await marketplace.name()
            assert.equal(name, 'TicketNFT', 'The name should be TicketNFT.')
            const symbol = await marketplace.symbol()
            assert.equal(symbol, 'TNFT', 'The symbol should be TNFT.')
        })
    })

    describe('Mint an NFT.', async () => {
        it('The hash \'metadata\' is not minted before the function call.', async () => {
            const hasBeenMinted = await marketplace.hasBeenMinted('metadata')
            assert.equal(hasBeenMinted, false, 'The hash \'metadata\' has not been minted, so it should be false.')
        })

        it('Mint a NFT with not sell date', async () => {
            await expectRevert(marketplace.createTicket(1, 1, 'event', [202303011800, 202302011000, 202301071215], 'A', 'A1', convertTokensToWei('1'), 4, 'metadata', owner, true, { from: creator }), 'This Ticket is not for sell yet');
        })

        it('Mint a NFT and emit events with hold ticket.', async () => {
            const result = await marketplace.createTicket(1, 1, 'event', [202303011800, 202302011000, 202302071215], 'A', 'A1', convertTokensToWei('1'), 4, 'metadata', owner, true, { from: creator })
            assert.equal(result.logs.length, 2, 'Should trigger two events.');
            // console.log(result);
            
            const ck_owner = await marketplace.ownerOf(1)
            assert.equal(ck_owner, creator, 'The owner should be the creator.');
            // console.log(ck_owner);

            assert.equal(result.logs[0].event, 'Transfer', 'Should be the \'Transfer\' event.');
            assert.equal(result.logs[0].args.from, 0x0, 'Should be the 0x0 address.');
            assert.equal(result.logs[0].args.to, creator, 'Should log the recipient which is the creator.');
            assert.equal(result.logs[0].args.tokenId, 1, 'Should log the token id which is 1.');

            //event ItemMinted(uint256 indexed tokenId, uint256 indexed EventID, address creator, string metadata);
            assert.equal(result.logs[1].event, 'TicketMinted', 'Should be the \'TicketMinted\' event.');
            assert.equal(result.logs[1].args.tokenId, 1, 'Should be the token id 1.');
            assert.equal(result.logs[1].args.EventID, 1, 'Should be the token id 1.');
            assert.equal(result.logs[1].args.creator, creator, 'Should log the creator.');
            assert.equal(result.logs[1].args.metadata, 'metadata', 'Should log the metadata correctly.');
            
            const ownerBefore = await web3.eth.getBalance(owner)
            // console.log('ownerBefore: ', ownerBefore)
            const creatorBefore = await web3.eth.getBalance(creator)
            // console.log('creatorBefore: ', creatorBefore)

            // create another ticket
            const result1 = await marketplace.createTicket(2, 1, 'event', [202303011800, 202302011000, 202302071215], 'A', 'A2', convertTokensToWei('1'), 4, 'metadata1', owner, false, { from: creator, value: convertTokensToWei('1') })
            assert.equal(result1.logs.length, 2, 'Should trigger three events.');
            // console.log(result1);
            const ownerAfter = await web3.eth.getBalance(owner)
            // console.log('ownerAfter: ', ownerAfter)
            const creatorAfter = await web3.eth.getBalance(creator)
            // console.log('creatorAfter: ', creatorAfter)

            // transfer avax
            assert.equal(parseInt(ownerBefore)+parseInt(convertTokensToWei('1')), ownerAfter, 'Owner should get 1 Avax')

            //event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
            assert.equal(result1.logs[0].event, 'Transfer', 'Should be the \'Transfer\' event.');
            assert.equal(result1.logs[0].args.from, 0x0, 'Should be the 0x0 address.');
            assert.equal(result1.logs[0].args.to, creator, 'Should log the recipient which is the creator.');
            assert.equal(result1.logs[0].args.tokenId, 2, 'Should log the token id which is 2.');

            //event ItemMinted(uint256 indexed tokenId, uint256 indexed EventID, address creator, string metadata);
            assert.equal(result1.logs[1].event, 'TicketMinted', 'Should be the \'TicketMinted\' event.');
            assert.equal(result1.logs[1].args.tokenId, 2, 'Should be the token id 2.');
            assert.equal(result1.logs[1].args.EventID, 1, 'Should be the token id 1.');
            assert.equal(result1.logs[1].args.creator, creator, 'Should log the creator.');
            assert.equal(result1.logs[1].args.metadata, 'metadata1', 'Should log the metadata1 correctly.');
        })

        it('The new item has the correct data.', async () => {
            const item = await marketplace.getTicket(1);
            assert.notEqual(item.creator, buyer, 'The buyer should not be the creator.')
            assert.equal(item.EvntID, 1, 'Event ID should be the \'1\'.')
            assert.equal(item.EventName, 'event', 'Event name should be the \'event\'.')
            assert.equal(parseInt(item.dateEvent.toString()), '202303011800', 'dateEvent should be the \'202303011800\'.')
            assert.equal(item.zone, 'A', 'Zone should be the \'A\'.')
            assert.equal(item.seat, 'A1', 'Seat should be the \'A1\'.')
            assert.equal(item.owner, creator, 'The creator should be the Onwer.')
            assert.equal(item.creator, creator, 'The creator is the creator.')
            assert.equal(parseInt(item.priceSeat.toString()), convertTokensToWei('1'), 'Price should be the "'+convertTokensToWei('1')+'" wei.')
            assert.equal(item.metadata, 'metadata', 'Metadata should be \'metadata\'.')
        })

        it('Check if hash has been minted and that you cannot mint the same hash again.', async () => {
            const hasBeenMinted = await marketplace.hasBeenMinted('metadata')
            assert.equal(hasBeenMinted, true, 'The hash \'metadata\' has been minted.')
            await expectRevert(marketplace.createTicket(1, 1, 'event', [202303011800, 202302011000, 202302071215], 'A', 'A3', convertTokensToWei('1'), 4, 'metadata', owner, true, { from: creator }), 'This metadata has already been used to mint an NFT.');
        })

        it('Check Quota of buy ticket.', async () => {
            const UserLimit = await marketplace.UserLimit(creator, 1)
            assert.equal(UserLimit, 1, 'User limit should = 1.')
        })

    })

    describe('List a NFT.', async () => {
        it('The token id 2 has not been listed.', async () => {
            const hasBeenListed = await marketplace.hasBeenListed(2)
            assert.equal(hasBeenListed, false, 'The NFT with token id 2 has not been listed yet.')
        })

        it('The NFT with token id 2 cannot be listed by anyone who doesn\'t own it.', async () => {
            await expectRevert(marketplace.addProduct(2, convertTokensToWei('1.2'), convertTokensToWei('0.0005'), { from: contractDeployer }), 'Only the owner of the Ticket can call this function.');
            await expectRevert(marketplace.addProduct(2, convertTokensToWei('1.2'), convertTokensToWei('0.0005'), { from: buyer }), 'Only the owner of the Ticket can call this function.');
        })

        it('Transfer the NFT to the Marketplace SC.', async () => {
            const result = await marketplace.addProduct(2, convertTokensToWei('1.2'), convertTokensToWei('0.0005'), { from: creator })
            assert.equal(result.logs.length, 2, 'Should trigger two events.');

            //event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
            assert.equal(result.logs[0].event, 'Transfer', 'Should be the \'Transfer\' event.');
            assert.equal(result.logs[0].args.from, creator, 'Should be the creator address.');
            assert.equal(result.logs[0].args.to, marketplace.address, 'Should log the recipient which is the marketplace.');
            assert.equal(result.logs[0].args.tokenId, 2, 'Should log the token id which is 2.');

            //event event addedProduct(uint256 indexed ticketId, uint price, address indexed seller);
            assert.equal(result.logs[1].event, 'addedProduct', 'Should be the \'addedProduct\' event.');
            assert.equal(result.logs[1].args.ticketId, 2, 'Should be the token id 1.');
            assert.equal(result.logs[1].args.price, convertTokensToWei('1.2'), 'Should log the price which is 1.2 AVAX.');
            assert.equal(result.logs[1].args.seller, creator, 'Should log the creator as the seller.');
        })

        it('The listing has the correct data.', async () => {
            const listing = await marketplace.getProdust(2)
            assert.equal(listing[0], convertTokensToWei('1.2'), 'The price is 1.2 AVAX.')
            assert.equal(listing[1], convertTokensToWei('0.0005'), 'The gas is 0.0005 Avax.')
        })  

        it('The Marketplace SC is now the owner of the NFT and not the seller.', async () => {
            const ownerOfNFT = await marketplace.ownerOf(2)
            assert.equal(ownerOfNFT, marketplace.address, 'The owner should be the marketplace.');
            assert.notEqual(ownerOfNFT, creator, 'The owner should not be the creator.');
        })

        it('The token id 2 can be claimed back by the creator if not sold.', async () => {
            const claimableBySeller = await marketplace.claimableByAccount(2)
            assert.equal(claimableBySeller, creator, 'The NFT with token id 2 can be claimed by the creator if not sold.')
        })

        it('The token id 2 has been listed.', async () => {
            const hasBeenListed = await marketplace.hasBeenListed(2)
            assert.equal(hasBeenListed, true, 'The NFT with token id 2 has been listed.')
        })

    })

    describe('Create and add Ticket to Market Place.', async () => {
        it('create ticket.', async () => {
            const result = await marketplace.createTicket(3, 1, 'event', [202303011800, 202302011000, 202302091215], 'A', 'A3', convertTokensToWei('1'), 4, 'metadata3', owner, false, { from: creator, value: convertTokensToWei('1') })
            // console.log(result);
            assert.equal(result.logs.length, 2, 'Should trigger five events.');
            //event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
            assert.equal(result.logs[0].event, 'Transfer', 'Should be the \'Transfer\' event.');
            assert.equal(result.logs[0].args.from, 0x0, 'Should be the 0x0 address.');
            assert.equal(result.logs[0].args.to, creator, 'Should log the recipient which is the creator.');
            assert.equal(result.logs[0].args.tokenId, 3, 'Should log the token id which is 3.');

            //event ItemMinted(uint256 indexed tokenId, uint256 indexed EventID, address creator, string metadata);
            assert.equal(result.logs[1].event, 'TicketMinted', 'Should be the \'TicketMinted\' event.');
            assert.equal(result.logs[1].args.tokenId, 3, 'Should be the token id 3.');
            assert.equal(result.logs[1].args.EventID, 1, 'Should be the token id 1.');
            assert.equal(result.logs[1].args.creator, creator, 'Should log the creator.');
            assert.equal(result.logs[1].args.metadata, 'metadata3', 'Should log the metadata3 correctly.');
        })

        it('add ticket to market place.', async () => {
            const result = await marketplace.addProduct(3, convertTokensToWei('1.2'), convertTokensToWei('0.0005'), { from: creator })
            assert.equal(result.logs.length, 2, 'Should trigger two events.');

            //event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
            assert.equal(result.logs[0].event, 'Transfer', 'Should be the \'Transfer\' event.');
            assert.equal(result.logs[0].args.from, creator, 'Should be the creator address.');
            assert.equal(result.logs[0].args.to, marketplace.address, 'Should log the recipient which is the marketplace.');
            assert.equal(result.logs[0].args.tokenId, 3, 'Should log the token id which is 2.');

            //event event addedProduct(uint256 indexed ticketId, uint price, address indexed seller);
            assert.equal(result.logs[1].event, 'addedProduct', 'Should be the \'addedProduct\' event.');
            assert.equal(result.logs[1].args.ticketId, 3, 'Should be the token id 1.');
            assert.equal(result.logs[1].args.price, convertTokensToWei('1.2'), 'Should log the price which is 1.2 AVAX.');
            assert.equal(result.logs[1].args.seller, creator, 'Should log the creator as the seller.');
        })

        it('The new item from market place has the correct data.', async () => {
            const item = await marketplace.getTicket(3)
            assert.notEqual(item.creator, buyer, 'The buyer should not be the creator.')
            assert.equal(item.EvntID, 1, 'Event ID should be the \'1\'.')
            assert.equal(item.EventName, 'event', 'Event name should be the \'event\'.')
            assert.equal(parseInt(item.dateEvent.toString()), 202303011800, 'dateEvent should be the \'202202011800\'.')
            assert.equal(item.zone, 'A', 'Zone should be the \'A\'.')
            assert.equal(item.seat, 'A3', 'Seat should be the \'A3\'.')
            assert.equal(item.owner, creator, 'The creator should be the Onwer.')
            assert.equal(item.creator, creator, 'The creator is the creator.')
            assert.equal(parseInt(item.priceSeat.toString()), convertTokensToWei('1'), 'Price should be the "'+convertTokensToWei('1')+'" wei.')
            assert.equal(item.metadata, 'metadata3', 'Metadata should be \'metadata3\'.')
        })

        it('The new item have correct data in market place.', async () => {
            const item = await marketplace.getProdust(3)
            assert.equal(parseInt(item[0].toString()), convertTokensToWei('1.2'), 'Price should be the "'+convertTokensToWei('1.2')+'" wei.')
            assert.equal(parseInt(item[1].toString()), convertTokensToWei('0.0005'), 'Price should be the "'+convertTokensToWei('0.0005')+'" wei.')
        })

        it('Check if hash has been minted and that you cannot mint the same hash again.', async () => {
            const hasBeenMinted = await marketplace.hasBeenMinted('metadata3')
            assert.equal(hasBeenMinted, true, 'The hash \'metadata3\' has been minted.')
            await expectRevert(marketplace.createTicket(4, 1, 'event', [202303011800, 202302011000, 202302071215], 'A', 'A3', convertTokensToWei('1'), 4, 'metadata3', owner, true, { from: creator }), 'This metadata has already been used to mint an NFT.');
        })

        it('The Marketplace SC is now the owner of the NFT and not the seller.', async () => {
            const ownerOfNFT = await marketplace.ownerOf(3)
            assert.equal(ownerOfNFT, marketplace.address, 'The owner should be the marketplace.');
            assert.notEqual(ownerOfNFT, creator, 'The owner should not be the creator.');
        })

        it('The token id 3 can be claimed back by the creator if not sold.', async () => {
            const claimableBySeller = await marketplace.claimableByAccount(3)
            assert.equal(claimableBySeller, creator, 'The NFT with token id 3 can be claimed by the creator if not sold.')
        })

        it('The token id 3 has been listed.', async () => {
            const hasBeenListed = await marketplace.hasBeenListed(3)
            assert.equal(hasBeenListed, true, 'The NFT with token id 3 has been listed.')
        })

        it('Get Listing data in market place.', async () => {
            const listing = await marketplace.getListing()
            assert.equal(listing.length, 2, 'Should trigger two ticket.');
            assert.equal(listing[0], 2, 'First ticket should be 2.');
            assert.equal(listing[1], 3, 'Second ticket should be 3.');
        })
    })

    describe('Cancel the listing.', async () => {
        it('The Product cannot be cancelled by an address that does not have the right to claim it.', async () => {
            await expectRevert(marketplace.cancelProduct(3, { from: contractDeployer }), 'Only the address that has listed the Ticket can hold or cancel the listing.');
            await expectRevert(marketplace.cancelProduct(3, { from: buyer }), 'Only the address that has listed the Ticket can hold or cancel the listing.');
        })

        it('Transfer the NFT back to the owner.', async () => {
            const result = await marketplace.cancelProduct(3, { from: creator })
            assert.equal(result.logs.length, 2, 'Should trigger three events.');

            //event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
            assert.equal(result.logs[0].event, 'Transfer', 'Should be the \'Transfer\' event.');
            assert.equal(result.logs[0].args.from, marketplace.address, 'Should be the marketplace address.');
            assert.equal(result.logs[0].args.to, creator, 'Should log the recipient that is the creator.');
            assert.equal(result.logs[0].args.tokenId, 3, 'Should log the token id which is 3.');

            //event event ListingCancelled(uint256 tokenId, uint256 price, address seller);
            assert.equal(result.logs[1].event, 'cancelSell', 'Should be the \'cancelSell\' event.');
            assert.equal(result.logs[1].args.ticketId, 3, 'Should be the token id 3.');
            assert.equal(result.logs[1].args.price, convertTokensToWei('1.2'), 'Should log the price which is 1.2 AVAX.');
            assert.equal(result.logs[1].args.seller, creator, 'Should log the creator as the one who cancels the listing.');
        })

        it('The seller is now the owner of the NFT and not the Marketplace SC.', async () => {
            const ownerOfNFT = await marketplace.ownerOf(3)
            assert.equal(ownerOfNFT, creator, 'The owner should be the creator.');
            assert.notEqual(ownerOfNFT, marketplace.address, 'The owner should not be the marketplace.');
        })

        it('The claimableByAccount mapping should be cleared.', async () => {
            const claimableBySeller = await marketplace.claimableByAccount(3)
            assert.equal(claimableBySeller, 0x0, 'The NFT with token id 3 cannot be claimed by anyone after its no longer listed.')
        })

        it('The listing should not exist anymore.', async () => {
            const listing = await marketplace.ListProduct(3)
            assert.equal(listing['0'], 0, 'The price is reset to 0.')
            assert.equal(listing['1'], 0x0, 'The address(0) should be the one which owns the listing.')
        })

        it('The token id 3 is not listed anymore.', async () => {
            const hasBeenListed = await marketplace.hasBeenListed(3)
            assert.equal(hasBeenListed, false, 'The NFT with token id 1 is not listed anymore.')
        })

    })

    describe('Buy a NFT.', async () => {
    //     //Make sure to list the item again
        before(async () => {
            await marketplace.addProduct(3, convertTokensToWei('1.2'), convertTokensToWei('0.0005'), { from: creator })
        });

        it('You cannot buy an item that is not listed or does not exist.', async () => {
            await expectRevert(marketplace.buyProduct(1, { from: buyer }), 'The ticket needs to be listed in order to be bought, hold or cancel.');
        })

        it('You need to pay the correct price of 1.2 AVAX.', async () => {
            await expectRevert(marketplace.buyProduct(2, { from: buyer, value: convertTokensToWei('4') }), 'You need to pay the correct price.');
        })

    //     //Define the balances to check later whether they've increased or decreased by the correct amount
        let balanceOfCreatorBeforePurchase;

        it('Buy the NFT.', async () => {
            balanceOfCreatorBeforePurchase = await web3.eth.getBalance(creator)
            const result = await marketplace.buyProduct(3, { from: buyer, value: convertTokensToWei('1.2') })
            assert.equal(result.logs.length, 2, 'Should trigger three events.');

            //event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
            assert.equal(result.logs[0].event, 'Transfer', 'Should be the \'Transfer\' event.');
            assert.equal(result.logs[0].args.from, marketplace.address, 'Should be the marketplace address.');
            assert.equal(result.logs[0].args.to, buyer, 'Should log the recipient that is the buyer.');
            assert.equal(result.logs[0].args.tokenId, 3, 'Should log the token id which is 3.');

            //event event ItemBought(uint256 tokenId, uint256 price, address seller);
            assert.equal(result.logs[1].event, 'productBought', 'Should be the \'productBought\' event.');
            assert.equal(result.logs[1].args.ticketId, 3, 'Should be the token id 3.');
            assert.equal(result.logs[1].args.price, convertTokensToWei('1.2'), 'Should log the price which is 1.2 AVAX.');
            assert.equal(result.logs[1].args.buyer, buyer, 'Should log the buyer address as the buyer.');
        })

        it('The buyer is now the owner of the NFT and not the Marketplace SC.', async () => {
            const ownerOfNFT = await marketplace.ownerOf(3)
            assert.equal(ownerOfNFT, buyer, 'The owner should be the buyer.');
            assert.notEqual(ownerOfNFT, marketplace.address, 'The owner should not be the marketplace.');
        })

        it('The claimableByAccount mapping should be cleared.', async () => {
            const claimableBySeller = await marketplace.claimableByAccount(3)
            assert.equal(claimableBySeller, 0x0, 'The NFT with token id 3 cannot be claimed by anyone after its no longer listed.')
        })

        it('The listing should not exist anymore.', async () => {
            const listing = await marketplace.getProdust(3)
            assert.equal(listing['0'], 0, 'The price is reset to 0.')
            assert.equal(listing['1'], 0, 'The gas is reset to 0.')
        })

        it('The token id 3 is not listed anymore.', async () => {
            const hasBeenListed = await marketplace.hasBeenListed(3)
            assert.equal(hasBeenListed, false, 'The NFT with token id 3 should not be listed anymore.')
        })

        it('The item has the correct data.', async () => {
            const item = await marketplace.getTicket(3)
            assert.notEqual(item.creator, buyer, 'The owner should not be the creator.')
            assert.equal(item.EvntID, 1, 'Event ID should be the \'1\'.')
            assert.equal(item.EventName, 'event', 'Event name should be the \'event\'.')
            assert.equal(parseInt(item.dateEvent.toString()), 202303011800, 'dateEvent should be the \'202303011800\'.')
            assert.equal(item.zone, 'A', 'Zone should be the \'A\'.')
            assert.equal(item.seat, 'A3', 'Seat should be the \'A3\'.')
            assert.equal(item.owner, buyer, 'The buyer is the owner now.')
            assert.equal(item.creator, creator, 'The creator is the creator.')
            assert.equal(parseInt(item.priceSeat.toString()), convertTokensToWei('1'), 'Price should be the "'+convertTokensToWei('1')+'" wei.')
            assert.equal(item.metadata, 'metadata3', 'Metadata should be \'metadata3\'.')
        })

        it('The User limit of buyer is 0.', async () => {
            const limit = await marketplace.UserLimit(buyer, 1)
            assert.equal(limit, 0, 'The limit of buyer should be 0.')
        })

        it('The balances of creator and first buyer are correct.', async () => {
            const balanceOfCreatorAfterPurchase = await web3.eth.getBalance(creator)
            assert.equal(balanceOfCreatorAfterPurchase, toBN(balanceOfCreatorBeforePurchase).add(toBN(convertTokensToWei('1.2'))), 'The balance of the creator should be increased by 1.2 AVAX after the purchase.')
        })

    //     it('The balances of creator, first buyer who is now the seller and second buyer are correct.', async () => {
    //         //List the item again, only this time by the new owner
    //         await marketplace.addProduct(3, convertTokensToWei('10'), convertTokensToWei('0.5'), 202212011000, true, { from: buyer })
    //         const balanceOfBuyerBeforePurchase = await web3.eth.getBalance(buyer)
    //         const balanceOfsecondBuyerBeforePurchase = await web3.eth.getBalance(secondBuyer)
    //         const rst_buy = await marketplace.buyProduct(1, 3, 202212041436, { from: secondBuyer, value: convertTokensToWei('10') })
    //         const balanceOfBuyerAfterPurchase = await web3.eth.getBalance(buyer)
    //         const balanceOfsecondBuyerAfterPurchase = await web3.eth.getBalance(secondBuyer)

    //         console.log('buyer before sell:' + balanceOfBuyerBeforePurchase);
    //         console.log('creator before buy:' + balanceOfsecondBuyerBeforePurchase);

    //         console.log('buyer after sell:' + balanceOfBuyerAfterPurchase);
    //         console.log('creator after buy:' + balanceOfsecondBuyerAfterPurchase);

    //         assert.equal(balanceOfBuyerAfterPurchase, toBN(balanceOfBuyerBeforePurchase).add(toBN(convertTokensToWei('10'))), 'The balance of the seller should increase by 80% of the sold amount.')
    //         // assert.equal(balanceOfsecondBuyerBeforePurchase, toBN(balanceOfsecondBuyerAfterPurchase).add(toBN(convertTokensToWei('10'))).add(toBN(rst_buy.receipt.gasUsed*100000000000)), 'The balance of the creator should increase by 20% of the sold amount.')
    //     })
    })
});