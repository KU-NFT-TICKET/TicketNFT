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
        uint256 dateSell;
        bool newProduct;
    }

    struct boughtProduct {
        uint price;
		uint gas;
    }

    // Mapping for list new and old product
    mapping (uint256 => product) public ListProduct;

    // Mapping to prevent the same item being listed twice
    mapping (uint256 => bool) public hasBeenListed;

    // Mapping used for listing when the owner transfers the token to the contract and would then wish to cancel the listing
    mapping (uint256 => address) public claimableByAccount;

    // mapping list detail of bought ticket
    mapping (uint256 => boughtProduct[]) public chainBuy;

    // array of all product just for listing
    uint256[] private products;

    // mapping key of list product
    mapping (uint256 => uint256) private _productID;

    // mapping of hold product
    mapping (uint256 => bool) public hasBeenHold;

    // user limit buy/event
    mapping (address => mapping(uint256 => uint256)) public UserLimit;
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

    modifier onlyListingAccount(uint256 ticketId) {
        require(
            msg.sender == claimableByAccount[ticketId],
            "Only the address that has listed the Ticket can hold or cancel the listing."
        );
        _;
    }

    modifier isListing(uint256 ticketId) {
        require(
            hasBeenListed[ticketId],
            "The ticket needs to be listed in order to be bought, hold or cancel."
        );
        _;
    }

    modifier isHolding(uint256 ticketId) {
        require(
            hasBeenHold[ticketId],
            "The ticket need to be Hold"
        );
        _;
    }

    // function
    function addProduct (uint256 _ticketId, uint _price, uint _gas, uint256 _dateSell, bool _newProduct) public onlyTokenOwner(_ticketId) {
        require(!hasBeenListed[_ticketId], "The ticket can only be listed once");
        //send the token to the smart contract
        _transfer(msg.sender, address(this), _ticketId);
        claimableByAccount[_ticketId] = msg.sender;
        ListProduct[_ticketId] = product(
            _ticketId,
            _price,
            _gas,
            msg.sender,
            _dateSell,
            _newProduct
        );
        hasBeenListed[_ticketId] = true;
        products.push(_ticketId);
        _productID[_ticketId] = products.length-1;
        emit addedProduct(_ticketId, _price, msg.sender);
    }

    function cancelProduct(uint256 _ticketId) public onlyListingAccount(_ticketId) isListing(_ticketId) {
        //send the token from the smart contract back to the one who listed it
        _transfer(address(this), msg.sender, _ticketId);
        uint price = ListProduct[_ticketId].price;
        delete claimableByAccount[_ticketId];
        delete ListProduct[_ticketId];
        delete hasBeenListed[_ticketId];
        products[_productID[_ticketId]] = products[products.length - 1];
        products.pop();
        emit cancelSell(_ticketId, price, msg.sender);
    }
    function buyProduct(uint256 _EventID, uint256 _ticketId, uint256 _dateBuy) public isListing(_ticketId) payable {
        require(ListProduct[_ticketId].price == msg.value, "You need to pay the correct price.");
        require(ListProduct[_ticketId].dateSell <= _dateBuy, "This Ticket is not for sell yet");
        require(UserLimit[msg.sender][_EventID] <= tokenIdToTicket[_ticketId].limit, "You buy Ticket of this event to the limit");
        // sent to owner
        payable(tokenIdToTicket[_ticketId].owner).transfer(msg.value);

        //transfer the token from the smart contract back to the buyer
        _transfer(address(this), msg.sender, _ticketId);

        //Modify the owner property of the item to be the buyer
        TicketNFT.ticket storage ticket = tokenIdToTicket[_ticketId];
        if (UserLimit[ticket.owner][_EventID] > 0) {
            UserLimit[ticket.owner][_EventID] -= 1;
        }
        ticket.owner = msg.sender;
        tokenIdToTicket[_ticketId] = ticket;

        // list chain of buy
        chainBuy[_ticketId].push(boughtProduct(ListProduct[_ticketId].price, ListProduct[_ticketId].gas));
        // user limit
        UserLimit[msg.sender][_EventID] += 1;
        //clean up
        delete ListProduct[_ticketId];
        delete claimableByAccount[_ticketId];
        delete hasBeenListed[_ticketId];
        products[_productID[_ticketId]] = products[products.length - 1];
        products.pop();
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

    function addholdProduct(uint256 _ticketId) public onlyListingAccount(_ticketId) isListing(_ticketId) returns(uint256) {
        require(!hasBeenHold[_ticketId], "The ticket can only be Hold once");
        hasBeenHold[_ticketId] = true;
        //clean up
        delete ListProduct[_ticketId];
        delete hasBeenListed[_ticketId];
        products[_productID[_ticketId]] = products[products.length - 1];
        products.pop();
        return _ticketId;
    }

    function transferHoldProduct(uint256 _ticketId, address _receive) public onlyListingAccount(_ticketId) isHolding(_ticketId) returns(uint256) {
        _transfer(address(this), _receive, _ticketId);

        delete claimableByAccount[_ticketId];
        return _ticketId;
    }

    function unHoldProduct(uint256 _ticketId) public onlyListingAccount(_ticketId) isHolding(_ticketId) {
        hasBeenHold[_ticketId] = false;
    }

    function create_sell(uint256 _EventID, string memory _EventName,
        uint256 _dateEvent,
        uint256 _dateSell,
        string memory _zone,
        string memory _seat,
        uint _priceSeat,
        uint _priceGas,
        uint256 __limit,
        string memory _metadata) public returns(uint256) 
    {
        uint256 _ticketID = MintTicket(_EventID, _EventName, _dateEvent, _zone, _seat, _priceSeat, _priceGas, __limit, _metadata, msg.sender);
        addProduct(_ticketID, _priceSeat, _priceGas, _dateSell, true);
        return _ticketID;
    }
}