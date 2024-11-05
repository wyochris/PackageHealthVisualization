import * as d3 from 'd3';


class Node implements d3.SimulationNodeDatum {
  public x: number | undefined;
  public y: number | undefined;
  constructor (public id: number) {}
  public name: string = ''; // Node name
  public health: number | undefined; // Node health
  public nodeSize: number | undefined; // Node size
  public isSubTree: boolean = false; // Whether the node is a subtree root
}

export const csvToTreeData = (data: string[][]) => {
    const [, nodeNames, nodeHealth, nodeTreeSize, nodeNum, rootNode, ...edges] = data;
  
    // Create nodes based on the node names and weights
    const nodes: Node[] = nodeNames.map((name, index) => {
      const node = new Node(nodeNum[index] ? parseFloat(nodeNum[index]) : -1);  // Node IDs are 1-based
      node.x = 0;
      node.y = 0;
      node.name = name;
      node.health = nodeHealth[index] ? parseFloat(nodeHealth[index]) : undefined;
      node.nodeSize = nodeTreeSize[index] ? parseFloat(nodeTreeSize[index])  : undefined;
      if (node.name.startsWith('SUBTREE_NODE')) {
        node.isSubTree = true;
      }
      else {
        node.isSubTree = false;
      }
      return node;
    });
  
    // root node
    const rootId = parseInt(rootNode[0], 10);
  
    // Create links based on parent-child relationships in the edges
    const links = edges
      .map(([from, to]) => ({
        source: parseInt(from, 10),
        target: parseInt(to, 10),
      }))
      .filter((link) => link.source && link.target); // Ensure only valid links are included
      console.log({nodes, links, rootNode: rootId});
  
    return { nodes, links, rootNode: rootId };
  };
  