#!/bin/bash +x

pushd $1
git commit --author="$2" -a -F "$3"
popd 