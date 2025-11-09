#![cfg_attr(not(feature = "export-abi"), no_main)]

#[cfg(not(feature = "export-abi"))]
#[no_mangle]
pub extern "C" fn main() {}

#[cfg(feature = "export-abi")]
fn main() {
    wikipay_contracts::WikiPayContract::print_from_args();
}
