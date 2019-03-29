workflow "Publish" {
  on = "push"
  resolves = ["build"]
}

action "build" {
  uses = "./.github/build/"
}

action "version" {
  uses = "./.github/version/"
  
}
