#!/bin/bash

function print_help {
  echo "Use: build-android.sh <output-dir> <project-dir> <target> <configuration>\n"
}

output_dir="$1"

project_dir="$2"
target_name="$3"
configuration="$4"

if [ ! -d "$project_dir" ]; then
  echo "Build directory doesn't exist."
  print_help
  exit 1
fi

echo "Building $project_dir"

android update project --name "$target_name" --path "$project_dir"

ant -f "$project_dir/build.xml" "$configuration"

output_apk="$project_dir/bin/$target_name-$configuration-unsigned.apk"

output_target="$output_dir/$target_name.apk"
if [ ! -d "$output_dir" ]; then
  mkdir "$output_dir"
fi

cp "$output_apk" "$output_target"


