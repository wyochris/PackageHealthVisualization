Algorithm
- cur depth = number of not dashes until first dash (─)
  - also prev depth
- use a stack to keep track of current parent (will do dfs essentially)
- if cur depth is greater then add a child to stack top; push cur onto stack top
- if it is the same depth or less then pop off; push cur onto stack top