// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract TicketNFT is ERC721URIStorage {

    constructor() ERC721("TicketNFT", "TNFT") {}

    // structure of ticket
    struct ticket {
        uint256 EvntID;
        string EventName;
        uint256 dateEvent;
        string zone;
        string seat;
        address owner;
        address creator;
        uint priceSeat;
        uint priceGas;
        string metadata;
    }
    // mapping 
    // ticket has been created and minted
    mapping(string => bool) public hasBeenMinted;
    // list of key => value of ticket
    mapping(uint256 => ticket) public tokenIdToTicket;
    // array of list ticket
    uint256[] private tickets;
    // user limit buy/event
    mapping (address => mapping(uint256 => uint256)) public UserLimit;

    // event 
    event TicketMinted(uint256 indexed tokenId, uint256 indexed EventID, address creator, string metadata);

    // function
    function MintTicket(
        uint256 _TicketID,
        uint256 _EventID,
        string memory _EventName,
        uint256 _dateEvent,
        string memory _zone,
        string memory _seat,
        uint _priceSeat,
        uint _priceGas,
        string memory _metadata,
        address _sender
        ) private returns (uint256) {

        ticket memory newTicket = ticket(_EventID, _EventName, _dateEvent, _zone, _seat, _sender, _sender, _priceSeat, _priceGas, _metadata);
        tickets.push(_TicketID);
        _safeMint(msg.sender, _TicketID);
        _setTokenURI(_TicketID, _metadata);
        tokenIdToTicket[_TicketID] = newTicket;
        hasBeenMinted[_metadata] = true;
        emit TicketMinted(_TicketID, _EventID, msg.sender, _metadata);
        return _TicketID;
    }

    function getTicket(uint256 _tokenId) public view returns (ticket memory) {
        return tokenIdToTicket[_tokenId];
    }

    function createTicket(
        uint256 _TicketID,
        uint256 _EventID,
        string memory _EventName,
        uint256[] memory _date,
        string memory _zone,
        string memory _seat,
        uint _priceSeat,
        uint256 _limit,
        string memory _metadata,
        address _owner,
        bool _isHold
    ) public payable returns(uint256) {
        // date 0 = date event, date 1 = date sell, date 2 = date buy
        uint256 _gas = gasleft();
        require(!hasBeenMinted[_metadata], "This metadata has already been used to mint an NFT.");
        require(_date[1] <= _date[2], "This Ticket is not for sell yet");
        if (!_isHold) {
            require(_priceSeat == msg.value, "You need to pay the correct price.");
            require(UserLimit[msg.sender][_EventID] + 1 <= _limit, "You buy Ticket of this event to the limit");
            uint _userlim = UserLimit[msg.sender][_EventID];
            if (_userlim > 0) {
                _userlim += 1;
            } else {
                _userlim = 1;
            }
            UserLimit[msg.sender][_EventID] = _userlim;
            payable(_owner).transfer(msg.value);
        }
        MintTicket(_TicketID, _EventID, _EventName, _date[0], _zone, _seat, _priceSeat, _gas, _metadata, msg.sender);
        return _TicketID;
    }

}