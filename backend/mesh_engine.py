import asyncio
import random
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

@dataclass
class MeshNode:
    node_id: str
    village_name: str
    lat: float
    lng: float
    battery_pct: int
    last_seen: str
    queue_depth: int
    hop_distance_to_hub: int
    link_quality: float
    status: str = "online"

@dataclass
class MeshPacket:
    packet_id: str
    origin_node: str
    payload_type: str
    payload_bytes_est: int
    created_at: str
    delivered_at: str | None
    hops: int
    status: str  # queued, in_transit, delivered, dropped

# 13 Real Tribal AP District Nodes (Approximate coordinates for ASR, Parvathipuram, etc.)
INITIAL_NODES = [
    MeshNode("MESH-HUB-01", "AMTZ Command Hub", 17.6167, 83.1500, 100, utc_now().isoformat(), 0, 0, 1.0),
    MeshNode("MESH-NODE-01", "Paderu HQ", 18.0772, 82.6625, 95, utc_now().isoformat(), 2, 1, 0.95),
    MeshNode("MESH-NODE-02", "Araku Valley", 18.3273, 82.8763, 82, utc_now().isoformat(), 4, 1, 0.88),
    MeshNode("MESH-NODE-03", "Chintapalle", 17.8667, 82.3500, 67, utc_now().isoformat(), 1, 2, 0.76),
    MeshNode("MESH-NODE-04", "G.K. Veedhi", 17.8136, 82.1642, 45, utc_now().isoformat(), 8, 3, 0.42),
    MeshNode("MESH-NODE-05", "Rampachodavaram", 17.4485, 81.7610, 92, utc_now().isoformat(), 0, 1, 0.91),
    MeshNode("MESH-NODE-06", "Maredumilli", 17.5936, 81.7011, 78, utc_now().isoformat(), 3, 2, 0.65),
    MeshNode("MESH-NODE-07", "Addateegala", 17.4833, 82.0167, 88, utc_now().isoformat(), 1, 2, 0.82),
    MeshNode("MESH-NODE-08", "Parvathipuram", 18.7833, 83.4333, 97, utc_now().isoformat(), 0, 1, 0.94),
    MeshNode("MESH-NODE-09", "Seethampeta", 18.6644, 83.7431, 61, utc_now().isoformat(), 5, 2, 0.55),
    MeshNode("MESH-NODE-10", "Kurupam", 18.8667, 83.5667, 34, utc_now().isoformat(), 12, 3, 0.28, status="degraded"),
    MeshNode("MESH-NODE-11", "Chinturu", 17.6000, 81.4000, 89, utc_now().isoformat(), 0, 1, 0.85),
    MeshNode("MESH-NODE-12", "Bhadrachalam Border", 17.6681, 80.8936, 73, utc_now().isoformat(), 4, 2, 0.68),
]

_mesh_nodes = {n.node_id: n for n in INITIAL_NODES}

def generate_mesh_status() -> list[dict[str, Any]]:
    return [
        {
            "node_id": n.node_id,
            "village_name": n.village_name,
            "status": n.status,
            "battery_pct": n.battery_pct,
            "last_seen": n.last_seen,
            "queue_depth": n.queue_depth,
            "lat": n.lat,
            "lng": n.lng,
            "link_quality": round(n.link_quality, 2),
            "hop_distance_to_hub": n.hop_distance_to_hub,
        }
        for n in _mesh_nodes.values()
    ]

def simulate_packet_routing(origin_node_id: str, payload_type: str = "triage_alert") -> dict[str, Any]:
    packet = MeshPacket(
        packet_id=str(uuid.uuid4()),
        origin_node=origin_node_id,
        payload_type=payload_type,
        payload_bytes_est=random.randint(500, 1200),
        created_at=utc_now().isoformat(),
        delivered_at=None,
        hops=0,
        status="queued"
    )
    
    node = _mesh_nodes.get(origin_node_id)
    if not node:
        packet.status = "dropped"
        return packet.__dict__

    node.queue_depth += 1
    
    # Store and forward simulation trace
    trace = [node.node_id]
    current_node = node
    
    # Forward simulation (instant trace computation for API)
    while current_node.hop_distance_to_hub > 0:
        if current_node.battery_pct < 5 or current_node.link_quality < 0.2:
            packet.status = "dropped"
            break
            
        if current_node.link_quality < 0.4:
            # Store in queue, don't forward immediately
            packet.status = "queued"
            break
            
        # Move one hop closer
        packet.hops += 1
        # Find next hop (a node with hop_distance = current - 1)
        next_hops = [n for n in _mesh_nodes.values() if n.hop_distance_to_hub == current_node.hop_distance_to_hub - 1]
        if not next_hops:
            packet.status = "dropped"
            break
        
        # Pick best link quality
        next_hop = max(next_hops, key=lambda n: n.link_quality)
        trace.append(next_hop.node_id)
        current_node = next_hop
        
    if current_node.hop_distance_to_hub == 0 and packet.status != "dropped":
        packet.status = "delivered"
        packet.delivered_at = utc_now().isoformat()
        
    res = packet.__dict__.copy()
    res["routing_trace"] = trace
    return res

async def run_mesh_heartbeat():
    while True:
        await asyncio.sleep(30)
        for node in _mesh_nodes.values():
            if node.node_id == "MESH-HUB-01":
                continue
                
            # Random drift
            node.link_quality = max(0.1, min(1.0, node.link_quality + random.uniform(-0.1, 0.1)))
            node.battery_pct = max(0, node.battery_pct - random.randint(0, 1))
            
            # Drain queue if link is good
            if node.link_quality > 0.5 and node.queue_depth > 0:
                node.queue_depth = max(0, node.queue_depth - random.randint(1, 3))
                
            if node.link_quality < 0.3 or node.battery_pct < 10:
                node.status = "degraded"
            elif node.battery_pct == 0:
                node.status = "offline"
            else:
                node.status = "online"
                
            node.last_seen = utc_now().isoformat()
