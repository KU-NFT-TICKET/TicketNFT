// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import './TicketNFT.sol';

contract TicketMarketplace is TicketNFT {
    using SafeMath for uint256;
    // structure of product
    struct product {
        uint256 ticketId;
        uint price;
        uint gas;
        address owner;
    }

    struct boughtProduct {
        uint price;
		uint gas;
    }

    // Mapping for list product
    mapping (uint256 => product) public ListProduct;

    // Mapping to prevent the same item being listed twice
    mapping (uint256 => bool) public hasBeenListed;

    // Mapping used for listing when the owner transfers the token to the contract and would then wish to cancel the listing
    mapping (uint256 => address) public claimableByAccount;

    // mapping list detail of bought ticket
    mapping (uint256 => boughtProduct[]) public chainBuy;

    // array of all product just for listing
    uint256[] public products;

    // mapping key of list product
    mapping (uint256 => uint256) public _productID;

    // event
    event addedProduct(uint256 indexed ticketId, uint price, address indexed seller);
    event cancelSell(uint256 indexed ticketId, uint price, address indexed seller);
    event productBought(uint256 indexed ticketId, uint price, address indexed buyer);

    // modify
    modifier onlyTokenOwner(uint256 ticketId) {
        require(
            msg.sender == ownerOf(ticketId),
            "Only the owner of the Ticket can call this function."
        );
        _;
    }

    modifier isCheck(uint256 ticketId, uint ck) {
        // 1 = claimableByAccount
        // 2 = hasBeenListed
        if (ck == 1) {
            require(
                msg.sender == claimableByAccount[ticketId],
                "Only the address that has listed the Ticket can hold or cancel the listing."
            );
        } else if (ck == 2) {
            require(
                hasBeenListed[ticketId],
                "The ticket needs to be listed in order to be bought, hold or cancel."
            );
        }
        _;
    }

    // function
    function addProduct (uint256 _ticketId, uint256 _price, uint256 _gas) public onlyTokenOwner(_ticketId) {
        require(!hasBeenListed[_ticketId], "The ticket can only be listed once");
        //send the token to the smart contract
        _transfer(msg.sender, address(this), _ticketId);
        claimableByAccount[_ticketId] = msg.sender;
        ListProduct[_ticketId] = product(
            _ticketId,
            _price,
            _gas,
            msg.sender
        );
        hasBeenListed[_ticketId] = true;
        products.push(_ticketId);
        _productID[_ticketId] = products.length-1;
        emit addedProduct(_ticketId, _price, msg.sender);
    }

    function cancelProduct(uint256 _ticketId) public isCheck(_ticketId, 1) isCheck(_ticketId, 2) {
        //send the token from the smart contract back to the one who listed it
        _transfer(address(this), msg.sender, _ticketId);
        emit cancelSell(_ticketId, ListProduct[_ticketId].price, msg.sender);
        delete claimableByAccount[_ticketId];
        clenup(_ticketId);
    }
    function buyProduct(uint256 _ticketId) public isCheck(_ticketId, 2) payable {
        uint256 _gas = gasleft();
        require(ListProduct[_ticketId].price == msg.value, "You need to pay the correct price.");
        // sent to owner
        payable(tokenIdToTicket[_ticketId].owner).transfer(msg.value);

        //transfer the token from the smart contract back to the buyer
        _transfer(address(this), msg.sender, _ticketId);
        tokenIdToTicket[_ticketId].owner = msg.sender;

        // list chain of buy
        chainBuy[_ticketId].push(boughtProduct(ListProduct[_ticketId].price, _gas));
        
        //clean up
        delete claimableByAccount[_ticketId];
        clenup(_ticketId);
        emit productBought(_ticketId, msg.value, msg.sender);
    }

    function getProdust(uint256 _ticketId) public view returns (uint256, uint256) {
        return (ListProduct[_ticketId].price, ListProduct[_ticketId].gas);
    }

    function getChainBuy(uint256 _ticketId) public view returns (boughtProduct[] memory) {
        return chainBuy[_ticketId];
    }

    function getListing() public view returns (uint256[] memory) {
        return products;
    }

    function clenup (uint256 _key) private {
        delete ListProduct[_key];
        delete hasBeenListed[_key];
        products[_productID[_key]] = products[products.length - 1];
        products.pop();
    }
}