#!/bin/sh

set -e

echo "Install & Bootstrap"
yarn install --no-progress && yarn bootstrap

echo "build"
yarn build && yarn bundle
