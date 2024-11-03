Algorithm
- cur depth = number of not dashes until first dash (─)
  - also prev depth
- use a stack to keep track of current parent (will do dfs essentially)
- if cur depth is greater then add a child to stack top; push cur onto stack top
- if it is the same depth or less then pop off until we reach same depth; push cur onto stack top

For chunking the nodes to make the trees visualize better
- Pretty simple recurse up until you get like size 50 or whatever, then pop on that node as one of the reduce ones, and pretend size 1 when returning up after "pruning off" the bottom of the tree
  - Top down would be harder to do
- Then process the subtrees for each of these nodes as their own tree file (regardings any of the other in the list as dead ends/single nodes)
  - Give the dead ends special names
- This whole process will returns a folder of tree files
  - Keep track of each outputted tree file's name
  - We'll then return a super tree file that contains the tree file names as their nodes and use this structure to link them all together
    - Node size will be how many nodes each node links to (so normal nodes are like all the same size, but ones to other trees are scaled to the number of nodes they point to)
      - We can calculate the number of nodes in each subtree during the inital simple recurse and refer to these sizes in the super tree file creation
- Color by the minimum