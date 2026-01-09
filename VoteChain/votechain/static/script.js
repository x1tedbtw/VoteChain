let selectedAccount = null;

// Load data on page load
document.addEventListener('DOMContentLoaded', function() {
    loadAccounts();
    loadResults();
    loadBlockchainInfo();
    loadVoters();
    checkVotingStatus();

    // Refresh data periodically
    setInterval(loadResults, 3000);        // Every 3 seconds
    setInterval(loadVoters, 5000);         // Every 5 seconds
    setInterval(checkVotingStatus, 3000);  // Every 3 seconds
    setInterval(loadBlockchainInfo, 10000); // Every 10 seconds
});

// Check if voting has finished (all accounts voted)
async function checkVotingStatus() {
    try {
        const response = await fetch('/api/voting-status');
        const data = await response.json();

        if (data.success) {
            if (data.all_voted) {
                // All accounts have voted - show finished message
                document.getElementById('votingForm').style.display = 'none';
                document.getElementById('votingFinished').style.display = 'block';

                // Update statistics
                document.getElementById('finishedTotal').textContent = data.voted_count;
                document.getElementById('finishedMax').textContent = data.total_accounts;
            } else {
                // Voting still active - show voting form
                document.getElementById('votingForm').style.display = 'block';
                document.getElementById('votingFinished').style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error checking voting status:', error);
    }
}

// Load available accounts from Ganache
async function loadAccounts() {
    try {
        const response = await fetch('/api/accounts');
        const data = await response.json();

        if (data.success) {
            const select = document.getElementById('voterAccount');
            select.innerHTML = '';

            let hasAvailableAccount = false;

            data.accounts.forEach((account, index) => {
                const option = document.createElement('option');
                option.value = account.address;

                // Format account display
                const votedStatus = account.has_voted ? '✓ Voted' : '○ Not voted';
                const addressShort = account.address.substring(0, 10) + '...';
                const balanceFormatted = account.balance.toFixed(2);

                option.textContent = `Account ${index + 1}: ${addressShort} (${balanceFormatted} ETH) ${votedStatus}`;
                option.disabled = account.has_voted;

                if (!account.has_voted) {
                    hasAvailableAccount = true;
                }

                select.appendChild(option);
            });

            // Select first available account automatically
            if (hasAvailableAccount) {
                const firstAvailable = data.accounts.find(acc => !acc.has_voted);
                if (firstAvailable) {
                    selectedAccount = firstAvailable.address;
                    select.value = firstAvailable.address;
                }
            } else {
                // No accounts available
                const option = document.createElement('option');
                option.textContent = 'All accounts have voted';
                option.disabled = true;
                select.appendChild(option);
            }
        }
    } catch (error) {
        console.error('Error loading accounts:', error);
        showMessage('Failed to load accounts', 'error');
    }
}

// Load blockchain connection info
async function loadBlockchainInfo() {
    try {
        const response = await fetch('/api/blockchain-info');
        const data = await response.json();

        if (data.success) {
            // Update contract address (shortened)
            const addressShort = data.contract_address.substring(0, 20) + '...';
            document.getElementById('contractAddress').textContent = addressShort;
            document.getElementById('contractAddress').title = data.contract_address; // Full address on hover

            // Update block number
            document.getElementById('blockNumber').textContent = data.block_number;

            // Update status
            document.getElementById('status').textContent = '🟢 Connected';
            document.getElementById('status').style.color = '#28a745';
        }
    } catch (error) {
        console.error('Error loading blockchain info:', error);
        document.getElementById('status').textContent = '🔴 Disconnected';
        document.getElementById('status').style.color = '#dc3545';
    }
}

// Load voting results from blockchain
async function loadResults() {
    try {
        const response = await fetch('/api/results');
        const data = await response.json();

        if (data.success) {
            // Update vote counts
            document.getElementById('yesCount').textContent = data.yes_votes;
            document.getElementById('noCount').textContent = data.no_votes;
            document.getElementById('totalCount').textContent = data.total_votes;

            // Update progress bar
            if (data.total_votes > 0) {
                const yesPercent = (data.yes_votes / data.total_votes) * 100;
                const noPercent = (data.no_votes / data.total_votes) * 100;

                // Set widths
                document.getElementById('progressYes').style.width = yesPercent + '%';
                document.getElementById('progressNo').style.width = noPercent + '%';

                // Show percentage text if bar is wide enough
                document.getElementById('progressYes').textContent =
                    yesPercent > 10 ? yesPercent.toFixed(0) + '%' : '';
                document.getElementById('progressNo').textContent =
                    noPercent > 10 ? noPercent.toFixed(0) + '%' : '';
            } else {
                // No votes yet - reset progress bar
                document.getElementById('progressYes').style.width = '0%';
                document.getElementById('progressNo').style.width = '0%';
                document.getElementById('progressYes').textContent = '';
                document.getElementById('progressNo').textContent = '';
            }
        }
    } catch (error) {
        console.error('Error loading results:', error);
    }
}

// Load list of voters who have cast votes
async function loadVoters() {
    try {
        const response = await fetch('/api/voters');
        const data = await response.json();

        if (data.success) {
            const votersList = document.getElementById('votersList');

            if (data.voters.length === 0) {
                votersList.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No votes cast yet</p>';
            } else {
                votersList.innerHTML = data.voters.map((voter, index) =>
                    `<div class="voter-item">
                        <strong>Voter ${index + 1}:</strong> ${voter}
                    </div>`
                ).join('');
            }
        }
    } catch (error) {
        console.error('Error loading voters:', error);
    }
}

// Cast a vote on the blockchain
async function castVote(voteChoice) {
    const select = document.getElementById('voterAccount');
    const account = select.value;

    // Validation
    if (!account) {
        showMessage('Please select an account', 'error');
        return;
    }

    // Disable vote buttons to prevent double-clicking
    const buttons = document.querySelectorAll('.vote-btn');
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.6';
    });

    // Show loading message
    const voteText = voteChoice ? 'YES' : 'NO';
    showMessage(`Casting ${voteText} vote... Please wait.`, 'success');

    try {
        const response = await fetch('/api/vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                vote: voteChoice,
                account: account
            })
        });

        const data = await response.json();

        if (data.success) {
            // Success message with transaction hash
            const txHashShort = data.transaction_hash.substring(0, 20) + '...';
            showMessage(
                `✓ Vote cast successfully! Transaction: ${txHashShort}`,
                'success'
            );

            // Reload all data after short delay
            setTimeout(() => {
                loadAccounts();
                loadResults();
                loadVoters();
                checkVotingStatus();
                loadBlockchainInfo();
            }, 1000);
        } else {
            // Error from backend
            showMessage('Error: ' + data.message, 'error');
        }
    } catch (error) {
        // Network or other error
        showMessage('Error casting vote: ' + error.message, 'error');
        console.error('Vote error:', error);
    } finally {
        // Re-enable buttons after 2 seconds
        setTimeout(() => {
            buttons.forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
            });
        }, 2000);
    }
}

// Show message to user (success or error)
function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = 'message ' + type;
    messageDiv.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Update account selection when dropdown changes
document.addEventListener('DOMContentLoaded', function() {
    const select = document.getElementById('voterAccount');
    if (select) {
        select.addEventListener('change', function() {
            selectedAccount = this.value;
        });
    }
});

// Optional: Add keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Press 'Y' for YES vote
    if (event.key === 'y' || event.key === 'Y') {
        const yesBtn = document.querySelector('.yes-btn');
        if (yesBtn && !yesBtn.disabled) {
            castVote(true);
        }
    }

    // Press 'N' for NO vote
    if (event.key === 'n' || event.key === 'N') {
        const noBtn = document.querySelector('.no-btn');
        if (noBtn && !noBtn.disabled) {
            castVote(false);
        }
    }
});

// Reset voting
async function resetVoting() {
    if (!confirm('Are you sure you want to reset all votes? This action will be recorded on the blockchain.')) {
        return;
    }

    const resetBtn = document.querySelector('.reset-btn');
    resetBtn.disabled = true;
    resetBtn.textContent = '⏳ Resetting...';

    try {
        const response = await fetch('/api/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();

        if (data.success) {
            showMessage(`✓ Voting reset successfully! Transaction: ${data.transaction_hash.substring(0, 20)}...`, 'success');

            // Reload all data
            setTimeout(() => {
                loadAccounts();
                loadResults();
                loadVoters();
                loadBlockchainInfo();
            }, 1000);
        } else {
            showMessage('❌ ' + data.message, 'error');
        }
    } catch (error) {
        showMessage('❌ Error resetting votes: ' + error.message, 'error');
    } finally {
        resetBtn.disabled = false;
        resetBtn.textContent = '🔄 Reset Voting';
    }
}