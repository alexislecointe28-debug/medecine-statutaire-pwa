#!/bin/bash
MSG=${1:-"update"}
cd "$(dirname "$0")"
git add -A
git commit -m "$MSG"
GIT_SSL_NO_VERIFY=true git push origin master
