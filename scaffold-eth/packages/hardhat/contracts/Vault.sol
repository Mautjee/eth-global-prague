// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Vault is ReentrancyGuard, Pausable, Ownable {
    enum ProposalStatus {
        Pending,
        Approved,
        Completed,
        Rejected,
        Expired
    }

    struct QueryProposal {
        uint256 id;
        address requester;
        string sqlQuery;
        string publicKey;
        uint256 timestamp;
        uint256 expirationTime;
        ProposalStatus status;
    }

    struct CompletedQuery {
        uint256 proposalId;
        string originalQuery;
        string publicKey;
        string encryptedResult;
        uint256 completedTimestamp;
    }

    // State Variables
    uint256 private proposalCounter;
    bytes21 public appId;
    uint256 public defaultExpirationPeriod;

    // Mappings
    mapping(uint256 => QueryProposal) public proposals;
    mapping(ProposalStatus => uint256[]) public proposalsByStatus;
    mapping(address => uint256[]) public userProposals;
    mapping(uint256 => CompletedQuery) public completedQueries;

    // Events
    event ProposalSubmitted(uint256 indexed proposalId, address indexed requester, string sqlQuery);
    event ProposalApproved(uint256 indexed proposalId, address indexed approver);
    event ProposalRejected(uint256 indexed proposalId, address indexed rejecter);
    event QueryCompleted(uint256 indexed proposalId, address indexed requester);
    event ProposalExpired(uint256 indexed proposalId);
    event ExpirationPeriodUpdated(uint256 newPeriod);

    constructor(bytes21 _appId) Ownable(msg.sender) {
        require(_appId != bytes21(0), "AppId cannot be zero");
        appId = _appId;
        defaultExpirationPeriod = 7 days;
        proposalCounter = 0; // Explicitly initialize
    }

    function proposeQuery(
        string calldata sqlQuery,
        string calldata publicKey
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(bytes(sqlQuery).length > 0, "SQL query cannot be empty");
        require(bytes(sqlQuery).length <= 1000, "SQL query too long");
        require(bytes(publicKey).length > 0, "Public key cannot be empty");

        proposalCounter++;
        uint256 proposalId = proposalCounter;

        QueryProposal memory newProposal = QueryProposal({
            id: proposalId,
            requester: msg.sender,
            sqlQuery: sqlQuery,
            publicKey: publicKey,
            timestamp: block.timestamp,
            expirationTime: block.timestamp + defaultExpirationPeriod,
            status: ProposalStatus.Pending
        });

        proposals[proposalId] = newProposal;
        proposalsByStatus[ProposalStatus.Pending].push(proposalId);
        userProposals[msg.sender].push(proposalId);

        emit ProposalSubmitted(proposalId, msg.sender, sqlQuery);
        return proposalId;
    }

    function approveProposal(uint256 proposalId) external onlyOwner whenNotPaused nonReentrant {
        QueryProposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(proposal.status == ProposalStatus.Pending, "Proposal not pending");
        require(block.timestamp < proposal.expirationTime, "Proposal expired");

        proposal.status = ProposalStatus.Approved;

        // Remove from Pending array
        _removeFromStatusArray(ProposalStatus.Pending, proposalId);

        // Add to Approved array
        proposalsByStatus[ProposalStatus.Approved].push(proposalId);

        emit ProposalApproved(proposalId, msg.sender);
    }

    function rejectProposal(uint256 proposalId) external onlyOwner whenNotPaused nonReentrant {
        QueryProposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(proposal.status == ProposalStatus.Pending, "Proposal not pending");

        proposal.status = ProposalStatus.Rejected;

        // Remove from Pending array
        _removeFromStatusArray(ProposalStatus.Pending, proposalId);

        // Add to Rejected array
        proposalsByStatus[ProposalStatus.Rejected].push(proposalId);

        emit ProposalRejected(proposalId, msg.sender);
    }

    function getApprovedProposals(uint256 offset, uint256 limit) external view returns (QueryProposal[] memory) {
        uint256[] storage approvedIds = proposalsByStatus[ProposalStatus.Approved];

        // Handle edge cases
        if (offset >= approvedIds.length) {
            return new QueryProposal[](0);
        }

        uint256 resultLength = approvedIds.length - offset;
        if (resultLength > limit) {
            resultLength = limit;
        }

        QueryProposal[] memory result = new QueryProposal[](resultLength);
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = proposals[approvedIds[offset + i]];
        }
        return result;
    }

    function consumeProposal(uint256 proposalId, string calldata encryptedResult) external whenNotPaused nonReentrant {
        // TODO: Implement ROFL authorization
        // Subcall.roflEnsureAuthorizedOrigin(appId);

        QueryProposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(proposal.status == ProposalStatus.Approved, "Proposal not approved");
        require(block.timestamp < proposal.expirationTime, "Proposal expired");
        require(bytes(encryptedResult).length > 0, "Encrypted result cannot be empty");

        CompletedQuery memory completedQuery = CompletedQuery({
            proposalId: proposalId,
            originalQuery: proposal.sqlQuery,
            publicKey: proposal.publicKey,
            encryptedResult: encryptedResult,
            completedTimestamp: block.timestamp
        });

        completedQueries[proposalId] = completedQuery;
        proposal.status = ProposalStatus.Completed;

        // Remove from Approved array
        _removeFromStatusArray(ProposalStatus.Approved, proposalId);

        // Add to Completed array
        proposalsByStatus[ProposalStatus.Completed].push(proposalId);

        emit QueryCompleted(proposalId, proposal.requester);
    }

    function checkAndUpdateExpiredProposals() external {
        _updateExpiredProposals(ProposalStatus.Pending);
        _updateExpiredProposals(ProposalStatus.Approved);
    }

    function _updateExpiredProposals(ProposalStatus status) internal {
        uint256[] storage statusProposals = proposalsByStatus[status];

        // Use a temporary array to track expired proposals to avoid array modification during iteration
        uint256[] memory expiredIds = new uint256[](statusProposals.length);
        uint256 expiredCount = 0;

        for (uint256 i = 0; i < statusProposals.length; i++) {
            uint256 proposalId = statusProposals[i];
            QueryProposal storage proposal = proposals[proposalId];
            if (block.timestamp >= proposal.expirationTime) {
                expiredIds[expiredCount] = proposalId;
                expiredCount++;
            }
        }

        // Process expired proposals
        for (uint256 i = 0; i < expiredCount; i++) {
            uint256 proposalId = expiredIds[i];
            proposals[proposalId].status = ProposalStatus.Expired;
            _removeFromStatusArray(status, proposalId);
            proposalsByStatus[ProposalStatus.Expired].push(proposalId);
            emit ProposalExpired(proposalId);
        }
    }

    function _removeFromStatusArray(ProposalStatus status, uint256 proposalId) internal {
        uint256[] storage statusArray = proposalsByStatus[status];
        for (uint256 i = 0; i < statusArray.length; i++) {
            if (statusArray[i] == proposalId) {
                statusArray[i] = statusArray[statusArray.length - 1];
                statusArray.pop();
                break;
            }
        }
    }

    function setDefaultExpirationPeriod(uint256 period) external onlyOwner {
        require(period > 0, "Expiration period must be greater than 0");
        require(period <= 365 days, "Expiration period too long");
        defaultExpirationPeriod = period;
        emit ExpirationPeriodUpdated(period);
    }

    function extendProposalExpiration(uint256 proposalId, uint256 extension) external onlyOwner {
        QueryProposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(extension > 0, "Extension must be greater than 0");
        require(extension <= 365 days, "Extension too long");
        proposal.expirationTime += extension;
    }

    function getProposalsByStatus(ProposalStatus status) external view returns (QueryProposal[] memory) {
        uint256[] storage proposalIds = proposalsByStatus[status];
        QueryProposal[] memory result = new QueryProposal[](proposalIds.length);
        for (uint256 i = 0; i < proposalIds.length; i++) {
            result[i] = proposals[proposalIds[i]];
        }
        return result;
    }

    function getUserProposals(address user) external view returns (QueryProposal[] memory) {
        require(user != address(0), "Invalid user address");
        uint256[] storage userProposalIds = userProposals[user];
        QueryProposal[] memory result = new QueryProposal[](userProposalIds.length);
        for (uint256 i = 0; i < userProposalIds.length; i++) {
            result[i] = proposals[userProposalIds[i]];
        }
        return result;
    }

    function getCompletedQuery(uint256 proposalId) external view returns (CompletedQuery memory) {
        require(completedQueries[proposalId].proposalId != 0, "Completed query does not exist");
        return completedQueries[proposalId];
    }

    function getProposal(uint256 proposalId) external view returns (QueryProposal memory) {
        require(proposals[proposalId].id != 0, "Proposal does not exist");
        return proposals[proposalId];
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
