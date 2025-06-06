
## Getting preact working locally

### Download

`npm pack preact` - download package

Get these files: `dist/preact.module.js`, `dist/signals.module.js`, `hooks/dist/hooks.module.js`, 

### Edit imports

Edit imports to point to local files, imports are in both signals and hooks.

* `import ... from "preact"` -> `import ... from "./preact.module.js"`
* `import ... from "preact/hooks"` -> `import ... from "./hooks.module.js"`

