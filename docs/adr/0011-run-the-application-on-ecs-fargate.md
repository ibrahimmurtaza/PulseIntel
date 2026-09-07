# Run the application on ECS Fargate

PulseIntel will run its modular monolith and background workers on ECS Fargate in v1. We chose this over EKS or a serverless-first runtime because it fits long-lived web processes, Socket.io connections, and worker jobs without introducing unnecessary platform complexity.
