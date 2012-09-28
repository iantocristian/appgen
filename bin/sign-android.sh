#!/bin/bash

function print_help {
  echo "Use: sign-android.sh <output-dir> <target> <keystore> <keystore-password> <keystore-key>\n"
}

output_dir="$1"
target_name="$2"

keystore="$3"
keystore_password="$4"
keystore_key="$5"

if [ ! -f "$keystore" ]; then
  echo "Keystore file not found."
  print_help
  exit 1
fi

echo "Signing $output_target"

output_target="$output_dir/$target_name.apk"
unsigned_output="$output_dir/$target_name-unsigned.apk"
signed_output="$output_dir/$target_name-signed.apk"

cp $output_target $unsigned_output
jarsigner -verbose -sigalg MD5withRSA -digestalg SHA1 -keystore $keystore -storepass $keystore_password $unsigned_output $keystore_key

if [ -f "$signed_output" ]; then
  rm $signed_output
fi
zipalign -v 4 $unsigned_output $signed_output
rm $unsigned_output

rm $output_target
mv $signed_output $output_target




