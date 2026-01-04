let selectedAccount = null;

// Load data on page load
document.addEventListener('DOMContentLoaded', function() {
    loadAccounts();
    loadResults();
    loadBlockchainInfo();
    loadVoters();

    // Refresh results every 3 seconds
    setInterval(loadResults, 3000);
    setInterval(loadVoters, 5000);
});

// Load available accounts
async function loadAccounts() {
    try {
        const response = await fetch('/api/accounts');
        const data = await response.json();

        if (data.success) {
            const select = document.getElementById('voterAccount');
            select.innerHTML = '';

            data.accounts.forEach((account, index) => {
                const option = document.createElement('option');
                option.value = account.address;
                const votedStatus = account.has_voted ? '✓ Voted' : '○ Not voted';
                option.textContent = `Account ${index + 1}: ${account.address.substring(0, 10)}... (${account.balance.toFixed(2)} ETH) ${votedStatus}`;
                option.disabled = account.has_voted;
                select.appendChild(option);
            });

            selectedAccount = data.accounts[0].address;
        }
    } catch (error) {
        console.error('Error loading accounts:', error);
    }
}

// Load blockchain info
async function loadBlockchainInfo() {
    try {
        const response = await fetch('/api/blockchain-info');
        const data = await response.json();

        if (data.success) {
            document.getElementById('contractAddress').textContent =
                data.contract_address.substring(0, 20) + '...';
            document.getElementById('blockNumber').textContent = data.block_number;
        }
    } catch (error) {
        console.error('Error loading blockchain info:', error);
        document.getElementById('status').textContent = '🔴 Disconnected';
    }
}

// Load voting results
async function loadResults() {
    try {
        const response = await fetch('/api/results');
        const data = await response.json();

        if (data.success) {
            document.getElementById('yesCount').textContent = data.yes_votes;
            document.getElementById('noCount').textContent = data.no_votes;
            document.getElementById('totalCount').textContent = data.total_votes;

            // Update progress bar
            if (data.total_votes > 0) {
                const yesPercent = (data.yes_votes / data.total_votes) * 100;
                const noPercent = (data.no_votes / data.total_votes) * 100;

                document.getElementById('progressYes').style.width = yesPercent + '%';
                document.getElementById('progressNo').style.width = noPercent + '%';

                document.getElementById('progressYes').textContent =
                    yesPercent > 10 ? yesPercent.toFixed(0) + '%' : '';
                document.getElementById('progressNo').textContent =
                    noPercent > 10 ? noPercent.toFixed(0) + '%' : '';
            }
        }
    } catch (error) {
        console.error('Error loading results:', error);
    }
}

// Load voters list
async function loadVoters() {
    try {
        const response = await fetch('/api/voters');
        const data = await response.json();

        if (data.success) {
            const votersList = document.getElementById('votersList');

            if (data.voters.length === 0) {
                votersList.innerHTML = '<p style="text-align: center; color: #6c757d;">No votes cast yet</p>';
            } else {
                votersList.innerHTML = data.voters.map((voter, index) =>
                    `<div class="voter-item">Voter ${index + 1}: ${voter}</div>`
                ).join('');
            }
        }
    } catch (error) {
        console.error('Error loading voters:', error);
    }
}

// Cast a vote
async function castVote(voteChoice) {
    const select = document.getElementById('voterAccount');
    const account = select.value;

    if (!account) {
        showMessage('Please select an account', 'error');
        return;
    }

    // Disable buttons
    const buttons = document.querySelectorAll('.vote-btn');
    buttons.forEach(btn => btn.disabled = true);

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
            showMessage(`Vote cast successfully! Transaction: ${data.transaction_hash.substring(0, 20)}...`, 'success');

            // Reload data
            setTimeout(() => {
                loadAccounts();
                loadResults();
                loadVoters();
            }, 1000);
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Error casting vote: ' + error.message, 'error');
    } finally {
        // Re-enable buttons
        buttons.forEach(btn => btn.disabled = false);
    }
}

// Show message
function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = 'message ' + type;

    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}