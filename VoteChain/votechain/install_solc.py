from solcx import install_solc, get_installable_solc_versions

# View available versions
print("Available Solidity versions:")
versions = get_installable_solc_versions()
print(versions[:10])  # Show first 10

# Install a specific version (adjust to match your contract's pragma)
version = '0.8.0'
print(f"\nInstalling solc {version}...")
install_solc(version)
print("✓ Installation complete!")