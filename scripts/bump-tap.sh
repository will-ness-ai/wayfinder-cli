#!/usr/bin/env bash
# Bump the Homebrew tap formula to a freshly published npm release.
#
# The release workflow runs this after `npm publish` succeeds. It resolves the
# published tarball, checksums it, and rewrites the formula's two release lines
# -- the tarball URL and its sha256 -- in the tap repo, then commits and pushes.
#
# Usage: scripts/bump-tap.sh <vX.Y.Z>
# Requires GH_TOKEN: a fine-grained token scoped to the tap repo, contents-write.
set -euo pipefail

tag="${1:?usage: bump-tap.sh <vX.Y.Z>}"
version="${tag#v}"

package="wayfinder-cli"
tap_repo="will-ness-ai/homebrew-tap"
formula_path="Formula/${package}.rb"
tarball_url="https://registry.npmjs.org/${package}/-/${package}-${version}.tgz"

# The registry can lag a few seconds behind a successful publish; retry.
tarball="$(mktemp)"
for attempt in 1 2 3 4 5; do
  if curl -fsSL "$tarball_url" -o "$tarball"; then
    break
  fi
  if [ "$attempt" -eq 5 ]; then
    echo "tarball never appeared at ${tarball_url}" >&2
    exit 1
  fi
  echo "tarball not on the registry yet (attempt ${attempt}); waiting..." >&2
  sleep 10
done

sha256="$(sha256sum "$tarball" | cut -d' ' -f1)"

workdir="$(mktemp -d)"
git clone --depth 1 "https://x-access-token:${GH_TOKEN}@github.com/${tap_repo}.git" "$workdir"

formula="${workdir}/${formula_path}"
# The two lines a release changes: the tarball URL and its checksum.
sed -i -E "s|^(  url ).*|\1\"${tarball_url}\"|" "$formula"
sed -i -E "s|^(  sha256 ).*|\1\"${sha256}\"|" "$formula"

git -C "$workdir" config user.name "github-actions[bot]"
git -C "$workdir" config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git -C "$workdir" add "$formula_path"
git -C "$workdir" commit -m "${package} ${version}"
git -C "$workdir" push
