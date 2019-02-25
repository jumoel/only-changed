# `only-changed`

A CLI tool to run another CLI tool with only the files changed in your VCS (`git` or `hg`) history.

Usage:

```
only-changed [--extensions=...] [--changedSince=...] <script> [script-arguments...]
```

Example, which runs `prettier --check` on the `.js` files since `master`:

```
only-changed --extensions=.js --changedSince=master -- prettier --check
```

## Implementation

A fancy wrapper around `jest-changed-files` :)
