#!/bin/bash +x

pushd $1
git pull
git commit --author="$2" -a -F "$3"
git push
popd
