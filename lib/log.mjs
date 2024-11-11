const PRINT_LINKS = false;

const arrowDirections = {in: '←', out: '→', node: '-'};
const logTreeStructure = (cache, rootKey) => {
  const printItem = ({key, type, direction = 'node', summary = 'none'}, depth = 0) => {
    const indentation = '  '.repeat(depth);
    const arrowDirection = arrowDirections[direction];
    console.log(`${indentation}  ${arrowDirection} [${type}] ${key}: ${summary}`);
  };

  let visited;
  const recurse = (key, depth = 0) => {
    if (depth === 0) {
      visited = new Set();
    }
    const issue = cache[key];
    const { type, summary } = issue;
    if (visited.has(key)) {
      // printItem({type, key, summary: '<circular reference>'}, depth);
      return;
    }
    printItem({type, key, summary}, depth);
    if (issue.subtasks) {
      for (const childKey of issue.subtasks) {
        recurse(childKey, depth + 1);
      }
    }
    if (issue.links) {
      for (const link of issue.links) {
        printItem({...link, summary: cache[link.key].summary}, depth + 1);
        if (link.direction === 'out') {
          recurse(link.key, depth + 1);
        }
      }
    }
    visited.add(key);
  };

  recurse(rootKey);

};

export { logTreeStructure };
