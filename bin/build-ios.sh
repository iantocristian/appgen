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

if [ ! -d "$output_dir" ]; then
  mkdir "$output_dir"
fi

LOG="$output_dir/appgen.log"

echo "security unlock-keychain -p \"$keychain_password\" \"$keychain\"" >> $LOG
security unlock-keychain -p "$keychain_password" "$keychain" >> $LOG

echo "security default-keychain -s \"$keychain\"" >> $LOG
security default-keychain -s "$keychain" >> $LOG

current_dir=`pwd`
working_dir=${current_dir}

cd "$output_dir"
current_dir=`pwd`
output_dir=${current_dir}

cd "$working_dir"

if [ -f "$output_dir/$target_name.app" ]; then
  rm "$output_dir/$target_name.app" >> $LOG
fi

echo "\"$provisioning_profile\" \"$HOME/Library/MobileDevice/Provisioning Profiles/temporary.mobileprovision\"" >> $LOG
cp "$provisioning_profile" "$HOME/Library/MobileDevice/Provisioning Profiles/temporary.mobileprovision" >> $LOG

echo "xcodebuild -verbose -project \"$project_file\" -target \"$target_name\" -sdk iphoneos \
  -configuration $configuration clean build \
  CONFIGURATION_BUILD_DIR=\"$output_dir\" \
" >> $LOG

xcodebuild -verbose -project "$project_file" -target "$target_name" -sdk iphoneos \
  -configuration $configuration clean build \
  CONFIGURATION_BUILD_DIR="$output_dir" \
  # PROVISIONING_PROFILE="temporary" \
  # CODE_SIGN_IDENTITY="$code_sign_identity" \
  # OTHER_CODE_SIGN_FLAGS="--keychain $keychain" \
 >> $LOG

echo "rm \"$HOME/Library/MobileDevice/Provisioning Profiles/temporary.mobileprovision\"" >> $LOG
rm "$HOME/Library/MobileDevice/Provisioning Profiles/temporary.mobileprovision" >> $LOG

if [ $? -ne 0 ]; then
  echo "Build failed."
  exit $?
fi

exit 0

