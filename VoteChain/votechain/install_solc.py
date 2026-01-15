from solcx import install_solc, get_installable_solc_versions

print("Available Solidity versions:")
versions = get_installable_solc_versions()
print(versions[:10])
version = '0.8.0'
print(f"\nInstalling solc {version}...")
install_solc(version)
print("✓ Installation complete!")