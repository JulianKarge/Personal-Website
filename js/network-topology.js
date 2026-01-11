/**
 * Network Topology Visualization
 * Interactive canvas-based visualization of different network topologies
 */

class NetworkTopologyVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error(`Canvas with id "${canvasId}" not found`);
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this.nodes = [];
    this.connections = [];
    this.dataPackets = [];
    this.currentTopology = 'star';
    this.hoveredNode = null;
    this.animationId = null;

    // Configuration
    this.config = {
      nodeCount: 8,
      nodeRadius: 20,
      nodeColor: '#06b6d4',
      nodeHoverColor: '#0ea5e9',
      centerNodeColor: '#ec4899',
      connectionColor: 'rgba(6, 182, 212, 0.3)',
      connectionWidth: 2,
      packetSize: 4,
      packetSpeed: 2,
      maxPackets: 15,
      packetSpawnInterval: 800,
      glowIntensity: 15
    };

    // Topology data
    this.topologyInfo = {
      star: {
        name: 'Star Topology',
        description: 'Alle Knoten sind mit einem zentralen Hub verbunden. Einfache Verwaltung, aber der zentrale Punkt ist kritisch.',
        pros: ['Einfache Fehlerdiagnose', 'Einfach erweiterbar'],
        cons: ['Single Point of Failure', 'Hoher Kabelaufwand']
      },
      ring: {
        name: 'Ring Topology',
        description: 'Knoten sind in einem Ring verbunden. Jeder Knoten ist mit genau zwei Nachbarn verbunden, Daten fließen in eine Richtung.',
        pros: ['Keine Kollisionen', 'Gleichmäßige Datenverteilung'],
        cons: ['Ausfall unterbricht gesamtes Netz', 'Schwierig zu erweitern']
      },
      mesh: {
        name: 'Mesh Topology',
        description: 'Vollvermaschtes Netzwerk - jeder Knoten ist mit jedem anderen verbunden. Maximale Redundanz und Ausfallsicherheit.',
        pros: ['Höchste Ausfallsicherheit', 'Optimale Datenrouten'],
        cons: ['Sehr hoher Kabelaufwand', 'Komplexe Verwaltung']
      },
      bus: {
        name: 'Bus Topology',
        description: 'Alle Knoten sind an eine zentrale Leitung angeschlossen. Einfach und kostengünstig für kleine Netzwerke.',
        pros: ['Einfache Installation', 'Kostengünstig'],
        cons: ['Bus-Ausfall = Totalausfall', 'Performance-Probleme bei vielen Knoten']
      },
      tree: {
        name: 'Tree Topology',
        description: 'Hierarchische Struktur mit Root-Node und verzweigten Ebenen. Kombiniert Vorteile von Bus und Star.',
        pros: ['Skalierbar', 'Fehlerdiagnose pro Zweig'],
        cons: ['Root-Ausfall kritisch', 'Kabelaufwand moderat']
      },
      hybrid: {
        name: 'Hybrid Topology',
        description: 'Kombination verschiedener Topologien für optimale Flexibilität. Nutzt Vorteile mehrerer Strukturen.',
        pros: ['Sehr flexibel', 'Optimierbar für Anforderungen'],
        cons: ['Komplex in der Planung', 'Höhere Kosten']
      }
    };

    this.init();
  }

  init() {
    this.setupCanvas();
    this.setupEventListeners();
    this.createTopology(this.currentTopology);
    this.startAnimation();
    this.startPacketSpawning();
  }

  setupCanvas() {
    const resizeCanvas = () => {
      const container = this.canvas.parentElement;
      const rect = container.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
      this.centerX = this.canvas.width / 2;
      this.centerY = this.canvas.height / 2;
      this.radius = Math.min(this.canvas.width, this.canvas.height) * 0.35;
    };

    resizeCanvas();
    window.addEventListener('resize', () => {
      resizeCanvas();
      this.createTopology(this.currentTopology, false);
    });
  }

  setupEventListeners() {
    // Topology button clicks
    const buttons = document.querySelectorAll('.topology-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const topology = btn.dataset.topology;
        this.switchTopology(topology);
      });
    });

    // Mouse events for node interaction
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let foundNode = null;
    for (const node of this.nodes) {
      const dx = mouseX - node.x;
      const dy = mouseY - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.config.nodeRadius) {
        foundNode = node;
        break;
      }
    }

    this.hoveredNode = foundNode;
    this.updateTooltip(foundNode, mouseX, mouseY);
  }

  handleMouseLeave() {
    this.hoveredNode = null;
    this.hideTooltip();
  }

  updateTooltip(node, x, y) {
    const tooltip = document.getElementById('nodeTooltip');
    if (!tooltip) return;

    if (node) {
      tooltip.classList.remove('hidden');
      tooltip.classList.add('visible');
      tooltip.style.left = `${x + 15}px`;
      tooltip.style.top = `${y + 15}px`;

      document.getElementById('tooltipNodeId').textContent = node.id;
      document.getElementById('tooltipConnections').textContent = node.connections;
    } else {
      this.hideTooltip();
    }
  }

  hideTooltip() {
    const tooltip = document.getElementById('nodeTooltip');
    if (tooltip) {
      tooltip.classList.remove('visible');
      tooltip.classList.add('hidden');
    }
  }

  switchTopology(topology) {
    this.currentTopology = topology;
    this.createTopology(topology);
    this.updateTopologyInfo(topology);
  }

  updateTopologyInfo(topology) {
    const info = this.topologyInfo[topology];
    document.getElementById('topologyName').textContent = info.name;
    document.getElementById('topologyDescription').textContent = info.description;
    document.getElementById('topologyPro1').textContent = info.pros[0];
    document.getElementById('topologyPro2').textContent = info.pros[1];
    document.getElementById('topologyCon1').textContent = info.cons[0];
    document.getElementById('topologyCon2').textContent = info.cons[1];
  }

  createTopology(type, clearPackets = true) {
    this.nodes = [];
    this.connections = [];
    if (clearPackets) {
      this.dataPackets = [];
    }

    switch (type) {
      case 'star':
        this.createStarTopology();
        break;
      case 'ring':
        this.createRingTopology();
        break;
      case 'mesh':
        this.createMeshTopology();
        break;
      case 'bus':
        this.createBusTopology();
        break;
      case 'tree':
        this.createTreeTopology();
        break;
      case 'hybrid':
        this.createHybridTopology();
        break;
    }

    // Calculate actual connection counts for each node
    this.calculateConnectionCounts();
  }

  calculateConnectionCounts() {
    // Reset all connection counts to 0
    this.nodes.forEach(node => node.connections = 0);

    // Count connections for each node
    this.connections.forEach(conn => {
      this.nodes[conn.from].connections++;
      this.nodes[conn.to].connections++;
    });
  }

  createStarTopology() {
    // Center node
    this.nodes.push({
      id: 'Hub',
      x: this.centerX,
      y: this.centerY,
      isCenter: true
    });

    // Peripheral nodes
    const angleStep = (Math.PI * 2) / this.config.nodeCount;
    for (let i = 0; i < this.config.nodeCount; i++) {
      const angle = i * angleStep;
      const x = this.centerX + Math.cos(angle) * this.radius;
      const y = this.centerY + Math.sin(angle) * this.radius;

      this.nodes.push({
        id: `N${i + 1}`,
        x,
        y,
        isCenter: false
      });

      this.connections.push({
        from: 0,
        to: i + 1
      });
    }
  }

  createRingTopology() {
    const angleStep = (Math.PI * 2) / this.config.nodeCount;
    for (let i = 0; i < this.config.nodeCount; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = this.centerX + Math.cos(angle) * this.radius;
      const y = this.centerY + Math.sin(angle) * this.radius;

      this.nodes.push({
        id: `N${i + 1}`,
        x,
        y,
        isCenter: false
      });

      // Connect to next node (circular)
      this.connections.push({
        from: i,
        to: (i + 1) % this.config.nodeCount
      });
    }
  }

  createMeshTopology() {
    const angleStep = (Math.PI * 2) / this.config.nodeCount;
    for (let i = 0; i < this.config.nodeCount; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = this.centerX + Math.cos(angle) * this.radius;
      const y = this.centerY + Math.sin(angle) * this.radius;

      this.nodes.push({
        id: `N${i + 1}`,
        x,
        y,
        isCenter: false
      });
    }

    // Connect every node to every other node
    for (let i = 0; i < this.config.nodeCount; i++) {
      for (let j = i + 1; j < this.config.nodeCount; j++) {
        this.connections.push({
          from: i,
          to: j
        });
      }
    }
  }

  createBusTopology() {
    const startX = this.centerX - this.radius;
    const endX = this.centerX + this.radius;
    const busY = this.centerY;
    const spacing = (endX - startX) / (this.config.nodeCount - 1);

    for (let i = 0; i < this.config.nodeCount; i++) {
      const x = startX + i * spacing;
      const y = busY + (i % 2 === 0 ? -60 : 60);

      this.nodes.push({
        id: `N${i + 1}`,
        x,
        y,
        isCenter: false,
        busX: x,
        busY: busY
      });
    }

    // Draw bus line (represented as connection from first to last along bus)
    for (let i = 0; i < this.config.nodeCount - 1; i++) {
      this.connections.push({
        from: i,
        to: i + 1,
        isBus: true
      });
    }
  }

  createTreeTopology() {
    // Root node
    this.nodes.push({
      id: 'Root',
      x: this.centerX,
      y: this.centerY - this.radius * 0.7,
      isCenter: true,
      level: 0
    });

    // Level 1 (3 nodes)
    const level1Count = 3;
    const level1Y = this.centerY - this.radius * 0.2;
    const level1Spacing = this.radius * 1.2;
    const level1StartX = this.centerX - level1Spacing;

    for (let i = 0; i < level1Count; i++) {
      const x = level1StartX + i * level1Spacing;
      this.nodes.push({
        id: `L1-${i + 1}`,
        x,
        y: level1Y,
        isCenter: false,
        level: 1
      });

      this.connections.push({
        from: 0,
        to: i + 1
      });
    }

    // Level 2 (children of level 1 nodes)
    const level2Y = this.centerY + this.radius * 0.4;
    let nodeIndex = level1Count + 1;

    for (let parent = 0; parent < level1Count; parent++) {
      const parentX = this.nodes[parent + 1].x;
      const childSpacing = this.radius * 0.4;

      // Only add children if we haven't exceeded nodeCount
      if (nodeIndex < this.config.nodeCount) {
        const x = parentX - childSpacing / 2;
        this.nodes.push({
          id: `L2-${nodeIndex}`,
          x,
          y: level2Y,
          isCenter: false,
          level: 2
        });

        this.connections.push({
          from: parent + 1,
          to: nodeIndex
        });
        nodeIndex++;
      }

      if (nodeIndex < this.config.nodeCount) {
        const x = parentX + childSpacing / 2;
        this.nodes.push({
          id: `L2-${nodeIndex}`,
          x,
          y: level2Y,
          isCenter: false,
          level: 2
        });

        this.connections.push({
          from: parent + 1,
          to: nodeIndex
        });
        nodeIndex++;
      }
    }
  }

  createHybridTopology() {
    // Central star with 3 nodes
    this.nodes.push({
      id: 'Hub',
      x: this.centerX,
      y: this.centerY,
      isCenter: true
    });

    // Star nodes
    const starPositions = [
      { angle: -Math.PI / 2, distance: this.radius * 0.6 },
      { angle: Math.PI / 6, distance: this.radius * 0.6 },
      { angle: 5 * Math.PI / 6, distance: this.radius * 0.6 }
    ];

    starPositions.forEach((pos, i) => {
      const x = this.centerX + Math.cos(pos.angle) * pos.distance;
      const y = this.centerY + Math.sin(pos.angle) * pos.distance;

      this.nodes.push({
        id: `S${i + 1}`,
        x,
        y,
        isCenter: false
      });

      this.connections.push({
        from: 0,
        to: i + 1
      });
    });

    // Ring around top star node
    const ringRadius = this.radius * 0.4;
    const ringCenter = this.nodes[1];
    const ringNodeCount = 3;
    const ringStartIndex = this.nodes.length;

    for (let i = 0; i < ringNodeCount; i++) {
      const angle = (i * Math.PI * 2 / ringNodeCount) - Math.PI / 2;
      const x = ringCenter.x + Math.cos(angle) * ringRadius;
      const y = ringCenter.y + Math.sin(angle) * ringRadius;

      this.nodes.push({
        id: `R${i + 1}`,
        x,
        y,
        isCenter: false
      });

      // Connect to center of ring
      this.connections.push({
        from: 1,
        to: ringStartIndex + i
      });

      // Connect in ring
      if (i > 0) {
        this.connections.push({
          from: ringStartIndex + i - 1,
          to: ringStartIndex + i
        });
      }
    }

    // Close the ring
    this.connections.push({
      from: ringStartIndex + ringNodeCount - 1,
      to: ringStartIndex
    });

    // Mesh between bottom two star nodes
    if (this.nodes.length < this.config.nodeCount) {
      this.connections.push({
        from: 2,
        to: 3
      });
    }
  }

  spawnDataPacket() {
    if (this.connections.length === 0 || this.dataPackets.length >= this.config.maxPackets) {
      return;
    }

    const connection = this.connections[Math.floor(Math.random() * this.connections.length)];
    const fromNode = this.nodes[connection.from];
    const toNode = this.nodes[connection.to];

    this.dataPackets.push({
      fromNode,
      toNode,
      progress: 0,
      speed: this.config.packetSpeed + Math.random() * 1,
      hue: Math.random() * 60 + 160 // Cyan to blue range
    });
  }

  startPacketSpawning() {
    setInterval(() => {
      if (Math.random() < 0.7) {
        this.spawnDataPacket();
      }
    }, this.config.packetSpawnInterval);
  }

  updateDataPackets() {
    for (let i = this.dataPackets.length - 1; i >= 0; i--) {
      const packet = this.dataPackets[i];
      packet.progress += packet.speed / 100;

      if (packet.progress >= 1) {
        this.dataPackets.splice(i, 1);
      }
    }
  }

  draw() {
    // Clear canvas properly
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw connections
    this.drawConnections();

    // Draw data packets
    this.drawDataPackets();

    // Draw nodes
    this.drawNodes();
  }

  drawConnections() {
    this.ctx.strokeStyle = this.config.connectionColor;
    this.ctx.lineWidth = this.config.connectionWidth;

    for (const conn of this.connections) {
      const fromNode = this.nodes[conn.from];
      const toNode = this.nodes[conn.to];

      this.ctx.beginPath();

      if (conn.isBus && fromNode.busY !== undefined) {
        // Draw bus topology connections
        this.ctx.moveTo(fromNode.x, fromNode.y);
        this.ctx.lineTo(fromNode.busX, fromNode.busY);
        this.ctx.lineTo(toNode.busX, toNode.busY);
        this.ctx.lineTo(toNode.x, toNode.y);
      } else {
        this.ctx.moveTo(fromNode.x, fromNode.y);
        this.ctx.lineTo(toNode.x, toNode.y);
      }

      this.ctx.stroke();
    }
  }

  drawDataPackets() {
    for (const packet of this.dataPackets) {
      const x = packet.fromNode.x + (packet.toNode.x - packet.fromNode.x) * packet.progress;
      const y = packet.fromNode.y + (packet.toNode.y - packet.fromNode.y) * packet.progress;

      // Glow effect
      const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, this.config.packetSize * 3);
      gradient.addColorStop(0, `hsla(${packet.hue}, 80%, 60%, 0.8)`);
      gradient.addColorStop(0.5, `hsla(${packet.hue}, 80%, 50%, 0.4)`);
      gradient.addColorStop(1, `hsla(${packet.hue}, 80%, 40%, 0)`);

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(x, y, this.config.packetSize * 3, 0, Math.PI * 2);
      this.ctx.fill();

      // Core
      this.ctx.fillStyle = `hsl(${packet.hue}, 100%, 70%)`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, this.config.packetSize, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawNodes() {
    for (const node of this.nodes) {
      const isHovered = this.hoveredNode === node;
      const radius = this.config.nodeRadius;

      // Glow effect
      if (isHovered || node.isCenter) {
        const glowColor = node.isCenter ? this.config.centerNodeColor : this.config.nodeHoverColor;
        const gradient = this.ctx.createRadialGradient(
          node.x, node.y, radius,
          node.x, node.y, radius + this.config.glowIntensity
        );
        gradient.addColorStop(0, glowColor);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, radius + this.config.glowIntensity, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // Node circle
      const nodeColor = node.isCenter
        ? this.config.centerNodeColor
        : isHovered
        ? this.config.nodeHoverColor
        : this.config.nodeColor;

      this.ctx.fillStyle = nodeColor;
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Border
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Label
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 12px Inter, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(node.id, node.x, node.y);
    }
  }

  animate() {
    this.updateDataPackets();
    this.draw();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  startAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.animate();
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const visualizer = new NetworkTopologyVisualizer('topologyCanvas');
});
