#!/bin/bash

function print_help {
  echo "Use: archive-ios.sh <output-dir> <target> <keychain> <keychain-password> <code-sign-identity> <provisioning-profile>\n"
}

output_dir="$1"
target_name="$2"

keychain="$3"
keychain_password="$4"
code_sign_identity="$5"
provisioning_profile="$6"

security unlock-keychain -p "$keychain_password" "$keychain"
security default-keychain -s "$keychain"

current_dir=`pwd`
working_dir=${current_dir}

cd "$output_dir"
current_dir=`pwd`
output_dir=${current_dir}

cd "$working_dir"

if [ -f "$output_dir/$target_name.ipa" ]; then
  rm "$output_dir/$target_name.ipa"
fi

/usr/bin/xcrun -sdk iphoneos PackageApplication -v "$output_dir/$target_name.app" -o "$output_dir/$target_name.ipa" --sign "$code_sign_identity" --embed "$provisioning_profile"

if [ $? -ne 0 ]; then
  echo "Archive failed."
  exit $?
fi

exit 0
