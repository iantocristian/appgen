#!/bin/bash

function print_help {
  echo "Use: build-ios.sh <output-dir> <xcodeproj> <target> <configuration> <keychain> <keychain-password> <code-sign-identity> <provisioning-profile>\n"
}

output_dir="$1"

project_file="$2"
target_name="$3"
configuration="$4"

keychain="$5"
keychain_password="$6"
code_sign_identity="$7"
provisioning_profile="$8"

security unlock-keychain -p "$keychain_password" "$keychain"
security default-keychain -s "$keychain"

if [ ! -d "$output_dir" ]; then
  mkdir "$output_dir"
fi

current_dir=`pwd`
working_dir=${current_dir}

cd "$output_dir"
current_dir=`pwd`
output_dir=${current_dir}

cd "$working_dir"

if [ -f "$output_dir/$target_name.app" ]; then
  rm "$output_dir/$target_name.app"
fi

xcodebuild -verbose -project "$project_file" -target "$target_name" -sdk iphoneos -configuration $configuration clean build CONFIGURATION_BUILD_DIR="$output_dir"

if [ $? -ne 0 ]; then
  echo "Build failed."
  exit $?
fi

exit 0

