from web3 import Web3
from solcx import compile_source
import json

# Connect to Ganache
ganache_url = "http://127.0.0.1:7545"  # Default Ganache GUI port
web3 = Web3(Web3.HTTPProvider(ganache_url))

# Check connection
if web3.is_connected():
    print("✓ Connected to Ganache")
else:
    print("✗ Failed to connect to Ganache")
    exit()

# Read the contract source code
with open('contracts/Voting.sol', 'r') as file:
    contract_source_code = file.read()

# Compile the contract
compiled_sol = compile_source(contract_source_code, output_values=['abi', 'bin'])
contract_id, contract_interface = compiled_sol.popitem()

# Get bytecode and ABI
bytecode = contract_interface['bin']
abi = contract_interface['abi']

# Set up account (use first account from Ganache)
web3.eth.default_account = web3.eth.accounts[0]
print(f"✓ Using account: {web3.eth.default_account}")

# Create contract instance
Voting = web3.eth.contract(abi=abi, bytecode=bytecode)

# Deploy contract
print("Deploying contract...")
tx_hash = Voting.constructor().transact()
tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash)

contract_address = tx_receipt.contractAddress
print(f"✓ Contract deployed at: {contract_address}")

# Save contract info to file
contract_info = {
    'address': contract_address,
    'abi': abi
}

with open('contract_info.json', 'w') as f:
    json.dump(contract_info, f, indent=4)

print("✓ Contract info saved to contract_info.json")