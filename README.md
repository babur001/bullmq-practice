flowchart LR
subgraph API[Express process - the Producer]
R[route handler] --> Q1[mathQueue.add]
end
Q1 --> REDIS[(Redis)]
REDIS --> W
subgraph WP[Worker process - the Consumer, run separately]
W[new Worker math, fn]
end
