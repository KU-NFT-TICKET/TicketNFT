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

    modifier isCheck(uint256[] memory ticketId, uint ck) {
        // 1 = claimableByAccount
        // 2 = hasBeenListed
        for (uint i = 0; i < ticketId.length; i++ ) {
            if (ck == 1) {
                require(
                    msg.sender == claimableByAccount[ticketId[i]],
                    "Only the address that has listed the Ticket can hold or cancel the listing."
                );
            } else if (ck == 2) {
                require(
                    hasBeenListed[ticketId[i]],
                    "The ticket needs to be listed in order to be bought, hold or cancel."
                );
            }
        }
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

    function cancelProduct(uint256[] memory _ticketId) public isCheck(_ticketId, 1) isCheck(_ticketId, 2) {
        //send the token from the smart contract back to the one who listed it
        for (uint i = 0; i < _ticketId.length; i++) {
            _transfer(address(this), msg.sender, _ticketId[i]);
            delete claimableByAccount[_ticketId[i]];
            clenup(_ticketId[i]);
            emit cancelSell(_ticketId[i], ListProduct[_ticketId[i]].price, msg.sender);
        }
    }
    function buyProduct(uint256 _EventID, uint256[] memory _ticketId, uint256 _dateBuy) public isCheck(_ticketId, 2) payable {
        require(ListProduct[_ticketId[0]].price*_ticketId.length == msg.value, "You need to pay the correct price.");
        require(ListProduct[_ticketId[0]].dateSell <= _dateBuy, "This Ticket is not for sell yet");
        require(UserLimit[msg.sender][_EventID] + _ticketId.length <= tokenIdToTicket[_ticketId[0]].limit, "You buy Ticket of this event to the limit");
        // sent to owner
        payable(tokenIdToTicket[_ticketId[0]].owner).transfer(msg.value);

        for (uint i = 0; i<_ticketId.length; i++) {
            //transfer the token from the smart contract back to the buyer
            _transfer(address(this), msg.sender, _ticketId[i]);

            //Modify the owner property of the item to be the buyer
            if (UserLimit[tokenIdToTicket[_ticketId[i]].owner][_EventID] > 0) {
                UserLimit[tokenIdToTicket[_ticketId[i]].owner][_EventID] -= 1;
            }
            tokenIdToTicket[_ticketId[i]].owner = msg.sender;

            // list chain of buy
            chainBuy[_ticketId[i]].push(boughtProduct(ListProduct[_ticketId[i]].price, ListProduct[_ticketId[i]].gas));
            
            //clean up
            delete claimableByAccount[_ticketId[i]];
            clenup(_ticketId[i]);
            emit productBought(_ticketId[i], msg.value, msg.sender);
        }
        // user limit
        UserLimit[msg.sender][_EventID] += _ticketId.length;
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

    function transferHoldProduct(uint256[] memory _ticketId, address _receive) public returns(uint256[] memory) {
        uint256[] memory trans;
        uint j = 0;
        for (uint i = 0; i<_ticketId.length; i++) {
            if (tokenIdToTicket[_ticketId[i]].creator == msg.sender) {
                _transfer(msg.sender, _receive, _ticketId[i]);
                tokenIdToTicket[_ticketId[i]].owner = _receive;
                trans[j] = _ticketId[i];
                j++;
            }
        }
        return trans;
    }

    function create_sell(uint256 _EventID, string memory _EventName,
        uint256 _dateEvent,
        uint256 _dateSell,
        string memory _zone,
        string memory _seat,
        uint _priceSeat,
        uint _priceGas,
        uint256 __limit,
        string memory _metadata,
        address _owner) public returns(uint256) 
    {
        uint256 _ticketID = MintTicket(_EventID, _EventName, _dateEvent, _zone, _seat, _priceSeat, _priceGas, __limit, _metadata, _owner);
        addProduct(_ticketID, _priceSeat, _priceGas, _dateSell, true);
        return _ticketID;
    }

    function clenup (uint256 _key) private {
        delete ListProduct[_key];
        delete hasBeenListed[_key];
        products[_productID[_key]] = products[products.length - 1];
        products.pop();
    }
}