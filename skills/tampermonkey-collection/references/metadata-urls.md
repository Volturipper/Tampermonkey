# Tampermonkey Update Metadata

Official documentation:

- https://www.tampermonkey.net/documentation.php?locale=en

Practical rule for this workspace:

- Keep `@version` semver-like and increment it before publishing a behavioral change.
- Set both `@updateURL` and `@downloadURL`.
- Use a public raw URL for cross-browser update checks, usually:

```text
https://raw.githubusercontent.com/OWNER/REPO/BRANCH/scripts/<script-id>/<file>.user.js
```

Tampermonkey can use the userscript itself as the update URL because the metadata block is present at the top of the file.
