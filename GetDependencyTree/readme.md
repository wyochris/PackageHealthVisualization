Installation
- npm pack
- npm install --global getdependencytree-1.0.0.tgz

Examples
- generate-raw-tree -p ../WebScraper/ -f raw_tree
  - p: path to the project
  - f: filename of output
- scrape-tree-table -rf raw_tree -sf scoring_data_file.csv
  - rf: the name of the raw tree file
  - sf: filename of outputted data file to be scored with the model
- generate-tree-file -rf raw_tree -tf tree_file -ps final_scores_results.csv
  - rf: the name of the raw tree file
  - tf: filename of outputted tree file
  - ps: filename of package scores
- generate-multi-tree-file -rf raw_tree -tfn tree_folder -tf tree_file -s 35 -ps final_scores_results.csv
  - tf: filename of outputted tree file
  - tfn: name of the folder containing outputted tree files
    - The one you specify the name for is the root, and you parse all the others
  - rf: the name of the raw tree file
  - s: the maximum size of the subtrees
    - To aid visualization via limiting the number of nodes somewhat
    - Might have to increase it for certain trees
  - ps: filename of package scores
   
Usage Flow
- NOTE: Everything but the R file has been tested on Unix stuff, and the R on Windows
  - Fix: Could convert to using fs for everything later
- Generate the raw tree
- Scrape for the tree table
  - Make sure the web scraper in WebScraper is up and running
  - Make a version without the packageNames and scores columns; this is for the model
    - Use a table editor like Excel or Numbers
- Run the R file for the model
  - Check to make sure that the schema is identical between the Node Project Data and the scraped output
    - Use the str() command, should be only numerical data
      - If numerical columns have extra commas in them:
        - Copy the column into a text editor
        - Remove all the commas
        - Past it back into the spreadsheet
  - Add package names back to score_results.csv, rename to final_scores_results.csv
- Generate tree or multi-tree
  - For multi-tree you may have to experiment with the size value, primarily by increasing it
