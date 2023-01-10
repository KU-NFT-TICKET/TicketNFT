// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

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
        bool IsUse;
        uint256 limit;
        string metadata;
    }
    // mapping 
    // ticket has been created and minted
    mapping(string => bool) public hasBeenMinted;
    // list of key => value of ticket
    mapping(uint256 => ticket) public tokenIdToTicket;
    // array of list ticket
    uint256[] private tickets;

    using Counters for Counters.Counter;
    Counters.Counter private _tokenTicketIds;

    // event 
    event TicketMinted(uint256 indexed tokenId, uint256 indexed EventID, address creator, string metadata);

    // function
    function MintTicket(
        uint256 _EventID,
        string memory _EventName,
        uint256 _dateEvent,
        string memory _zone,
        string memory _seat,
        uint _priceSeat,
        uint _priceGas,
        uint256 _limit,
        string memory _metadata,
        address _sender
        ) public returns (uint256) {

        require(
            !hasBeenMinted[_metadata],
            "This metadata has already been used to mint an NFT."
        );
        ticket memory newTicket = ticket(_EventID, _EventName, _dateEvent, _zone, _seat, _sender, _sender, _priceSeat, _priceGas, false, _limit, _metadata);
        _tokenTicketIds.increment();
        tickets.push(_tokenTicketIds.current());
        _safeMint(msg.sender, _tokenTicketIds.current());
        _setTokenURI(_tokenTicketIds.current(), _metadata);
        tokenIdToTicket[_tokenTicketIds.current()] = newTicket;
        hasBeenMinted[_metadata] = true;
        emit TicketMinted(_tokenTicketIds.current(), _EventID, msg.sender, _metadata);
        return _tokenTicketIds.current();
    }

    function getTicket(uint256 _tokenId) public view returns (ticket memory) {
        return tokenIdToTicket[_tokenId];
    }

    function useTicket(uint256 _tokenId) public returns(uint256) {
        require (tokenIdToTicket[_tokenId].owner == msg.sender, "You are not Owner of this Ticket");
        tokenIdToTicket[_tokenId].IsUse = true;
        return _tokenId;
    }

}