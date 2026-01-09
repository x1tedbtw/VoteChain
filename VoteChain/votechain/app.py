from flask import Flask, render_template, request, jsonify
from web3 import Web3
import json

app = Flask(__name__)

# Connect to Ganache
ganache_url = "http://127.0.0.1:7545"
web3 = Web3(Web3.HTTPProvider(ganache_url))

# Load contract info
with open('contract_info.json', 'r') as f:
    contract_info = json.load(f)

contract_address = contract_info['address']
contract_abi = contract_info['abi']

# Create contract instance
contract = web3.eth.contract(address=contract_address, abi=contract_abi)

# Default account for transactions
web3.eth.default_account = web3.eth.accounts[0]


@app.route('/')
def index():
    """Render main page"""
    return render_template('index.html')


@app.route('/api/vote', methods=['POST'])
def cast_vote():
    """Cast a vote on the blockchain"""
    try:
        data = request.json
        vote_choice = data.get('vote')  # True for Yes, False for No
        voter_account = data.get('account', web3.eth.accounts[0])

        # Check if already voted
        has_voted = contract.functions.hasVoted(voter_account).call()
        if has_voted:
            return jsonify({
                'success': False,
                'message': 'This account has already voted!'
            }), 400

        # Cast vote transaction
        tx_hash = contract.functions.vote(vote_choice).transact({
            'from': voter_account
        })

        # Wait for transaction to be mined
        tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash)

        return jsonify({
            'success': True,
            'message': 'Vote cast successfully!',
            'transaction_hash': tx_hash.hex(),
            'block_number': tx_receipt['blockNumber']
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@app.route('/api/results')
def get_results():
    """Get current voting results"""
    try:
        results = contract.functions.getResults().call()
        yes_votes = results[0]
        no_votes = results[1]
        total_votes = results[2]

        return jsonify({
            'success': True,
            'yes_votes': yes_votes,
            'no_votes': no_votes,
            'total_votes': total_votes
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@app.route('/api/accounts')
def get_accounts():
    """Get available Ganache accounts"""
    try:
        accounts = web3.eth.accounts
        accounts_with_balance = []

        for account in accounts:
            balance = web3.eth.get_balance(account)
            balance_eth = web3.from_wei(balance, 'ether')
            has_voted = contract.functions.hasVoted(account).call()

            accounts_with_balance.append({
                'address': account,
                'balance': float(balance_eth),
                'has_voted': has_voted
            })

        return jsonify({
            'success': True,
            'accounts': accounts_with_balance
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@app.route('/api/blockchain-info')
def blockchain_info():
    """Get blockchain information"""
    try:
        latest_block = web3.eth.get_block('latest')

        return jsonify({
            'success': True,
            'block_number': latest_block['number'],
            'block_hash': latest_block['hash'].hex(),
            'timestamp': latest_block['timestamp'],
            'transactions': len(latest_block['transactions']),
            'contract_address': contract_address
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@app.route('/api/voters')
def get_voters():
    """Get list of all voters"""
    try:
        voters = contract.functions.getVoters().call()

        return jsonify({
            'success': True,
            'voters': voters,
            'count': len(voters)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@app.route('/api/voting-status')
def voting_status():
    """Check if all accounts have voted"""
    try:
        accounts = web3.eth.accounts
        all_voted = True
        voted_count = 0

        for account in accounts:
            has_voted = contract.functions.hasVoted(account).call()
            if has_voted:
                voted_count += 1
            else:
                all_voted = False

        return jsonify({
            'success': True,
            'all_voted': all_voted,
            'voted_count': voted_count,
            'total_accounts': len(accounts)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@app.route('/api/reset', methods=['POST'])
def reset_voting():
    """Reset all votes (admin only)"""
    try:
        # Use the first account (contract deployer) as admin
        admin_account = web3.eth.accounts[0]

        # Check if this account is admin
        is_admin = contract.functions.isAdmin(admin_account).call()

        if not is_admin:
            return jsonify({
                'success': False,
                'message': 'Only admin can reset voting!'
            }), 403

        # Call reset function
        tx_hash = contract.functions.resetVoting().transact({
            'from': admin_account
        })

        # Wait for transaction
        tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash)

        return jsonify({
            'success': True,
            'message': 'Voting has been reset!',
            'transaction_hash': tx_hash.hex(),
            'block_number': tx_receipt['blockNumber']
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500
if __name__ == '__main__':
    print("=" * 50)
    print("VoteChain - Blockchain Voting System")
    print("=" * 50)
    print(f"Contract Address: {contract_address}")
    print(f"Connected to Ganache: {web3.is_connected()}")
    print("=" * 50)
    app.run(debug=True, port=5000)