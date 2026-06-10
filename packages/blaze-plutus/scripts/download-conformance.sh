#!/usr/bin/env bash
set -euo pipefail

# Downloads UPLC conformance tests from the canonical Plutus repository.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"
CONFORMANCE_DIR="$PACKAGE_DIR/conformance/tests"

ARCHIVE_URL="https://github.com/IntersectMBO/plutus/archive/master.tar.gz"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

echo "Downloading Plutus conformance tests..."
curl -sL "$ARCHIVE_URL" -o "$TMP_DIR/plutus.tar.gz"

echo "Extracting conformance tests..."
tar xzf "$TMP_DIR/plutus.tar.gz" -C "$TMP_DIR"

# Find the extracted directory (usually plutus-master)
EXTRACTED_DIR="$(ls -d "$TMP_DIR"/plutus-*/)"

SOURCE_DIR="$EXTRACTED_DIR/plutus-conformance/test-cases/uplc/evaluation"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "Error: Could not find conformance tests at $SOURCE_DIR"
  exit 1
fi

# Clean existing tests and copy fresh ones
rm -rf "$CONFORMANCE_DIR"
mkdir -p "$CONFORMANCE_DIR"
cp -r "$SOURCE_DIR"/* "$CONFORMANCE_DIR/"

# Count test cases
TEST_COUNT=$(find "$CONFORMANCE_DIR" -name "*.uplc" ! -name "*.expected" | wc -l | tr -d ' ')
echo "Downloaded $TEST_COUNT conformance test cases to $CONFORMANCE_DIR"
