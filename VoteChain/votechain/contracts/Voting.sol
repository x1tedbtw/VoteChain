// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    // State variables
    uint256 public yesVotes;
    uint256 public noVotes;
    uint256 public totalVotes;

    // Admin address (contract deployer)
    address public admin;

    // Mapping to track if an address has voted
    mapping(address => bool) public hasVoted;

    // Store all voters for transparency
    address[] public voters;

    // Event emitted when someone votes
    event VoteCast(address indexed voter, bool vote, uint256 timestamp);

    // Event emitted when voting is reset
    event VotingReset(address indexed admin, uint256 timestamp);

    // Constructor - sets the deployer as admin
    constructor() {
        yesVotes = 0;
        noVotes = 0;
        totalVotes = 0;
        admin = msg.sender;  // Person who deploys contract is admin
    }

    // Function to cast a vote
    function vote(bool _vote) public {
        require(!hasVoted[msg.sender], "You have already voted!");

        if (_vote) {
            yesVotes++;
        } else {
            noVotes++;
        }

        hasVoted[msg.sender] = true;
        voters.push(msg.sender);
        totalVotes++;

        emit VoteCast(msg.sender, _vote, block.timestamp);
    }

    // Function to get voting results
    function getResults() public view returns (uint256, uint256, uint256) {
        return (yesVotes, noVotes, totalVotes);
    }

    // Function to check if an address has voted
    function checkIfVoted(address _voter) public view returns (bool) {
        return hasVoted[_voter];
    }

    // Function to get all voters
    function getVoters() public view returns (address[] memory) {
        return voters;
    }

    // NEW: Reset function (only admin can call)
    function resetVoting() public {
        require(msg.sender == admin, "Only admin can reset voting!");

        // Clear all voters' voted status
        for (uint i = 0; i < voters.length; i++) {
            hasVoted[voters[i]] = false;
        }

        // Reset vote counts
        yesVotes = 0;
        noVotes = 0;
        totalVotes = 0;

        // Clear voters array
        delete voters;

        emit VotingReset(msg.sender, block.timestamp);
    }

    // NEW: Check if caller is admin
    function isAdmin(address _address) public view returns (bool) {
        return _address == admin;
    }
}