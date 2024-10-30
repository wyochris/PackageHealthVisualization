Setup
- Node v18.20.4 or higher works
- npm install
- node index.js

API (localhost:3000)

Create

Read

/getPackageData/{package name}
  - Returns: 
        {
            numDependencies,
            numDependents,
            numVersions,
            weeklyDownloads,
            unpackedSize, // in kB
            totalFiles,
            issues,
            pullRequests,
            lastPublished // 0, 1, or 2 for years, months, or days
        }
    - Examples
      - localhost:3000/getPackageData/%40tediousjs%2Fconnection-string
      - localhost:3000/getPackageData/puppeteer

Update

Delete
