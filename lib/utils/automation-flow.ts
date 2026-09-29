import type { FlowConnection, FlowNode } from "@/lib/types/automation-flow";

/** Return a stable topological order; nodes in a cycle stay in their saved order. */
export function topologicallyOrderNodes(
  nodes: FlowNode[],
  connections: FlowConnection[]
): FlowNode[] {
  const originalIndex = new Map(nodes.map((node, index) => [node.id, index]));
  const indegree = new Map(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map<string, string[]>();

  for (const connection of connections) {
    if (
      connection.fromNodeId === connection.toNodeId ||
      !indegree.has(connection.fromNodeId) ||
      !indegree.has(connection.toNodeId)
    ) {
      continue;
    }

    indegree.set(connection.toNodeId, (indegree.get(connection.toNodeId) || 0) + 1);
    outgoing.set(connection.fromNodeId, [
      ...(outgoing.get(connection.fromNodeId) || []),
      connection.toNodeId,
    ]);
  }

  const ready = nodes
    .filter((node) => indegree.get(node.id) === 0)
    .map((node) => node.id);
  const orderedIds: string[] = [];

  while (ready.length > 0) {
    ready.sort((left, right) => (originalIndex.get(left) || 0) - (originalIndex.get(right) || 0));
    const nodeId = ready.shift()!;
    orderedIds.push(nodeId);

    for (const targetId of outgoing.get(nodeId) || []) {
      const nextIndegree = (indegree.get(targetId) || 0) - 1;
      indegree.set(targetId, nextIndegree);
      if (nextIndegree === 0) ready.push(targetId);
    }
  }

  const ordered = new Set(orderedIds);
  return [
    ...orderedIds.map((id) => nodes.find((node) => node.id === id)!).filter(Boolean),
    ...nodes.filter((node) => !ordered.has(node.id)),
  ];
}
