- npm init -y
- chmod +x index.js
- https://dev.to/scooperdev/use-npm-pack-to-test-your-packages-locally-486e
  - npm pack --pack-destination ~
  - npm install --global getdependencytree-1.0.0.tgz
- add these to the package, then npm install
  -   "bin": {
    "my-command": "./index.js",
    "generate-raw-tree": "./getrawtree.js",
    "generate-tree-file": "./gettreefile.js",
    "generate-tree-scores": "./gettreefile.js"
  }