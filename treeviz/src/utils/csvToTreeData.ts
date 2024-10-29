export const csvToTreeData = (data: string[][]) => {
    const [, nodeNames, nodeWeights, rootNode, ...edges] = data;
  
    // Create nodes based on the node names and weights
    const nodes = nodeNames.map((name, index) => ({
      id: index + 1,  // Node IDs are 1-based
      name,
      weight: parseInt(nodeWeights[index], 10),
    }));
  
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
  