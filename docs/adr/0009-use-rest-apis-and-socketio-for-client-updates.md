# Use REST APIs and Socket.io for client updates

PulseIntel will use REST APIs for application reads and writes, and Socket.io for realtime delivery of alerts, collaboration updates, and other live client events. We chose this over GraphQL subscriptions or a raw websocket layer because it keeps the application contract straightforward while giving the v1 product a practical, well-supported realtime channel.
