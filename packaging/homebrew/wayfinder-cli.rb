require "language/node"

# The seed the will-ness-ai/homebrew-tap formula was created from. The live
# formula is in the tap; scripts/bump-tap.sh rewrites that clone alone, so the
# `url` and `sha256` below stay at the seeded values.
class WayfinderCli < Formula
  desc "CLI that renders planning skills as markdown for coding agents"
  homepage "https://github.com/will-ness-ai/wayfinder-cli"
  url "https://registry.npmjs.org/wayfinder-cli/-/wayfinder-cli-0.1.0.tgz"
  sha256 "0000000000000000000000000000000000000000000000000000000000000000"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/wayfinder --version")
  end
end
