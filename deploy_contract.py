from web3 import Web3
import json
from solcx import compile_source, install_solc, set_solc_version


try:
    install_solc('0.8.0')
    set_solc_version('0.8.0')
except Exception as e:
    print(f"Solc installation note: {e}")
ganache_url = "http://127.0.0.1:7545"
web3 = Web3(Web3.HTTPProvider(ganache_url))

if web3.is_connected():
    print("✓ Connected to Ganache")
else:
    print("✗ Failed to connect to Ganache")
    exit()

with open('contracts/Voting.sol', 'r') as file:
    contract_source_code = file.read()

compiled_sol = compile_source(contract_source_code, output_values=['abi', 'bin'])
contract_id, contract_interface = compiled_sol.popitem()
bytecode = contract_interface['bin']
abi = contract_interface['abi']
web3.eth.default_account = web3.eth.accounts[0]
print(f"✓ Using account: {web3.eth.default_account}")

Voting = web3.eth.contract(abi=abi, bytecode=bytecode)

tx_hash = Voting.constructor().transact()
tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash)

contract_address = tx_receipt.contractAddress
print(f"✓ Contract deployed at: {contract_address}")
contract_info = {
    'address': contract_address,
    'abi': abi
}

with open('contract_info.json', 'w') as f:
    json.dump(contract_info, f, indent=4)

print("✓ Contract info saved to contract_info.json")