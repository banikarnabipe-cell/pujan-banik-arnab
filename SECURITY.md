# Security Policy

## Credential handling rules for this repository

1. **Tokens never enter the work tree.** The GitHub PAT lives in a protected
   file outside any git repository (e.g. `~/.secrets/github_pat`, mode `0600`).
   The exact path is a per-machine detail — never write it into the repo.
2. **No tokens in remote URLs.** Remotes use plain `https://github.com/...` URLs. Authentication is supplied at request time by a git credential helper that reads the protected file.
3. **No tokens in config.** Verified: `git config -l` contains zero occurrences of the token value.
4. **Secrets are gitignored:** `.env`, `.env.*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `credentials*.json`, `.secrets/` must never be committed.
5. **If a secret is ever exposed:** revoke it immediately at GitHub → Settings → Developer settings → Personal access tokens, then rotate.

## Push policy

- History pushed to `main` must be **clean**: no `.env`, no logs (`*.log`), no tool caches, no `node_modules`.
- The local workspace history contains environment internals and is **not** pushed; the site ships as a fresh, curated history.

## Reporting

Report suspected leaks to the repository owner immediately.
