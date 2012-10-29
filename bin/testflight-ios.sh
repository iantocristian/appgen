#!/bin/bash

function print_help {
  echo "Use: testflight-ios.sh <output-dir> <target> <team-token> <api-token> <notify> <distribution-lists>\n"
}

output_dir="$1"
target_name="$2"

team_token="$3"
api_token="$4"

notify="$5"
distribution_lists="$6"

LOG="$output_dir/appgen.log"

/bin/rm "$output_dir/$target_name.app.dSYM.zip" >> $LOG

/usr/bin/zip -r "$output_dir/$target_name.app.dSYM.zip" "$output_dir/$target_name.app.dSYM" >> $LOG

echo "Uploading to TestFlight... " >> $LOG

/usr/bin/curl "http://testflightapp.com/api/builds.json" \
-F file=@"$output_dir/$target_name.ipa" \
-F dsym=@"$output_dir/$target_name.app.dSYM.zip" \
-F api_token="$api_token" \
-F team_token="$team_token" \
-F notes="Build uploaded automatically by appgen." \
-F notify=$notify \
-F distribution_lists="$distribution_lists" >> $LOG

echo "done." >> $LOG