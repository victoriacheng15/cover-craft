# Docker Build Experiment

This directory exists to archive container build configurations and evaluate packaging trade-offs for full-stack monorepos. The files support an experiment measuring compilation speed, host processor utilization, and final storage footprint. By analyzing these configurations, developers can identify optimal caching strategies for complex local workspaces.

## Empirical Metrics

```text
+------------------------+-----------------+-----------------+--------------+------------+
| Metric                 | Single-Stage    | Multi-Stage     | Difference   | % Change   |
+------------------------+-----------------+-----------------+--------------+------------+
| Final Image Size       | 5.17 GB         | 3.26 GB         | -1.91 GB     | -36.9%     |
| Network Packets (Est)  | 3,446,667       | 2,173,333       | -1,273,334   |            |
| First-Time Build Time  | 1:52.79         | 2:20.31         | +27.52s      | +24.4%     |
| Host CPU Usage (Avg)   | 150%            | 166%            | +16%         | +10.7%     |
+------------------------+-----------------+-----------------+--------------+------------+
```

The network packet count estimates the number of Ethernet frames needed to distribute each container image. This calculation divides the total image size in bytes by a standard Maximum Transmission Unit (MTU) size of 1,500 bytes per packet. The difference column highlights the total packet transmission savings achieved by stripping compilation dependencies.

## Build Commands

```bash
# Multi-stage build
time podman build -t cover-craft-all-in-one:latest -f docs/docker/Dockerfile .

# Single-stage build
time podman build -t cover-craft-single:latest -f docs/docker/Dockerfile.single .
```
