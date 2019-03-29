workflow "Publish" {
  on = "push"
  resolves = ["build"]
}

action "build" {
  uses = "./.github/build/"
}
