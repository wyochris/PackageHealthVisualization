To Use Commands After Modifying
- npm pack
- npm install --global getdependencytree-1.0.0.tgz

Example
- generate-raw-tree -p ../WebScraper/ -f raw_tree
  - p: path to the project
  - f: filename of output
- generate-tree-file -rf raw_tree -tf tree_file
  - rf: the name of the raw tree file
  - tf: filename of outputted tree file
- scrape-tree-table -rf raw_tree -sf scoring_data_file 
  - rf: the name of the raw tree file
  - sf: filename of outputted data file to be scored with the model
- generate-tree-file -rf raw_tree -tf tree_file
  - rf: the name of the raw tree file
  - tf: filename of outputted tree file
- generate-multi-tree-file -rf raw_tree -tfn tree_folder -tf tree_file -s 35
  - tf: filename of outputted tree file
  - tfn: name of the folder containing outputted tree files
    - The one you specify the name for is the root, and you parse all the others
  - rf: the name of the raw tree file
  - s: the maximum size of the subtrees
    - To aid visualization via limiting the number of nodes somewhat
    - Might have to increase it for certain trees