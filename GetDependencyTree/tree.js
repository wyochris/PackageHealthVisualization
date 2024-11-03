const LEFT = 0;
const RIGHT = 1;

class TreeNode {
  constructor(value, score, idx, depth, subtreeSize) {
    this.value = value;
    this.score = score;
    this.idx = idx;
    this.depth = depth;
    this.descendants = [];
    this.parent = null;
    this.subtreeSize = subtreeSize;
  }

  get left() {
    return this.descendants[LEFT];
  }

  set left(node) {
    this.descendants[LEFT] = node;
    if (node) {
      node.parent = this;
    }
  }

  get right() {
    return this.descendants[RIGHT];
  }

  set right(node) {
    this.descendants[RIGHT] = node;
    if (node) {
      node.parent = this;
    }
  }
}

module.exports = TreeNode;