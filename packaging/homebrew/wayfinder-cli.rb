require "language/node"

# The canonical tap formula, mirrored into will-ness-ai/homebrew-tap by the
# release workflow. It wraps the published npm tarball, so npm stays the single
# source of truth and a release changes exactly two lines: `url` and `sha256`.
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
