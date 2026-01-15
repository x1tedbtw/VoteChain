pragma solidity ^0.8.0;

contract Voting {
    uint256 public yesVotes;
    uint256 public noVotes;
    uint256 public totalVotes;
    address public admin;
    mapping(address => bool) public hasVoted;
    address[] public voters;
    event VoteCast(address indexed voter, bool vote, uint256 timestamp);
    event VotingReset(address indexed admin, uint256 timestamp);
    constructor() {
        yesVotes = 0;
        noVotes = 0;
        totalVotes = 0;
        admin = msg.sender;
    }

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

    function getResults() public view returns (uint256, uint256, uint256) {
        return (yesVotes, noVotes, totalVotes);
    }

    function checkIfVoted(address _voter) public view returns (bool) {
        return hasVoted[_voter];
    }

    function getVoters() public view returns (address[] memory) {
        return voters;
    }

    function resetVoting() public {
        require(msg.sender == admin, "Only admin can reset voting!");
        for (uint i = 0; i < voters.length; i++) {
            hasVoted[voters[i]] = false;
        }

        yesVotes = 0;
        noVotes = 0;
        totalVotes = 0;
        delete voters;

        emit VotingReset(msg.sender, block.timestamp);
    }
    function isAdmin(address _address) public view returns (bool) {
        return _address == admin;
    }
}