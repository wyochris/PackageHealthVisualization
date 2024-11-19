# Package Health Visualization

Package Health Visualization is a tool designed to help developers analyze and understand the health and relationships of npm packages. It scrapes npm registry data and visualizes dependency trees, providing insights into package dependencies, package health, and potential vulnerabilities.

---

## Features

- **Dependency Visualization**:
  - Displays the hierarchical structure of package dependencies using interactive tree diagrams.
  
- **Multi-Tree Parsing**:
  - Handles multiple dependency trees for comprehensive visualization of complex package ecosystems.

- **Health Metrics**:
  - Extracts and displays metrics such as the number of dependencies, outdated packages, and vulnerabilities.

- **Data Parsing**:
  - Supports importing data via CSV files for custom CSV dependency analysis.

---

## Future Enhancements

- Integration with third-party vulnerability databases for real-time health assessments.
- Enhanced CSV export for sharing analysis results.
- Improved UI/UX for tree interaction and data exploration.

Each folder has a Node project: 

- GetDependencyTree
  - Generates tree files for visualization

- Playlist and RoseConnect
  - Example Node projects

- WebScraper
  - Gets npmjs.com package data for a given package

- treeviz
  - The tree visualizer web app
