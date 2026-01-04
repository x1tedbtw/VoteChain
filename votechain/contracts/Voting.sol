// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    // State variables
    uint256 public yesVotes;
    uint256 public noVotes;
    uint256 public totalVotes;

    // Mapping to track if an address has voted
    mapping(address => bool) public hasVoted;

    // Store all voters for transparency
    address[] public voters;

    // Event emitted when someone votes
    event VoteCast(address indexed voter, bool vote, uint256 timestamp);

    // Constructor
    constructor() {
        yesVotes = 0;
        noVotes = 0;
        totalVotes = 0;
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
}