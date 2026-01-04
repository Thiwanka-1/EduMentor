// src/services/mockMveg.js

export const MOCK_EXPLANATIONS = [
  /* ============================================================
     1️⃣ RECURSION
  ============================================================ */
  {
    _id: "mock-recursion",
    question: "Explain recursion",
    title: "Understanding Recursion",
    createdAt: new Date().toISOString(),
    answers: {
      simple: `
Recursion is a programming technique where a function solves a problem by calling itself.

Instead of solving the whole problem at once, the function breaks the problem into smaller versions of the same problem.

Every recursive function must have:
• A **base case** – the condition where the function stops calling itself
• A **recursive case** – the part where the function calls itself again

Without a base case, recursion will continue forever and cause a program crash.
`,

      analogy: `
Imagine standing between two mirrors facing each other.

Each mirror reflects the other, creating smaller and smaller reflections until they fade away.

Recursion works the same way:
• Each function call creates another smaller call
• Eventually, the base case stops the chain

Another example is opening nested boxes:
You open one box, inside it is another box, and so on — until you reach the last box.
`,

      code: `
/**
 * Example: Factorial using recursion
 * factorial(5) = 5 × 4 × 3 × 2 × 1
 */

function factorial(n) {
  // Base case
  if (n === 1) {
    return 1;
  }

  // Recursive case
  return n * factorial(n - 1);
}

console.log(factorial(5)); // Output: 120
`,

      summary: `
• A function that calls itself
• Requires a base case to stop execution
• Reduces complex problems into smaller parts
• Used in tree traversal, sorting, and graph algorithms
• Improves code clarity but can increase memory usage
`,
    },
  },

  /* ============================================================
     2️⃣ TCP vs UDP
  ============================================================ */
  {
    _id: "mock-tcp-udp",
    question: "What is the difference between TCP and UDP?",
    title: "TCP vs UDP Comparison",
    createdAt: new Date().toISOString(),
    answers: {
      simple: `
TCP and UDP are communication protocols used to send data across a network.

TCP focuses on **reliability**:
• Ensures data arrives correctly
• Resends lost packets

UDP focuses on **speed**:
• Sends data without checking delivery
• Faster but less reliable

The choice depends on the application requirements.
`,

      analogy: `
TCP is like sending a registered postal letter:
• The sender gets confirmation
• Lost letters are resent

UDP is like making an announcement over a loudspeaker:
• Fast delivery
• No guarantee everyone hears it

Streaming services prefer speed (UDP),
while emails require reliability (TCP).
`,

      code: `
# Python example of socket types

import socket

# TCP socket
tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# UDP socket
udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
`,

      summary: `
• TCP: reliable, ordered, slower
• UDP: fast, unordered, unreliable
• TCP used for HTTP, FTP, Email
• UDP used for video streaming, gaming, VoIP
`,
    },
  },

  /* ============================================================
     3️⃣ STACK vs QUEUE
  ============================================================ */
  {
    _id: "mock-stack-queue",
    question: "Explain Stack and Queue data structures",
    title: "Stack vs Queue",
    createdAt: new Date().toISOString(),
    answers: {
      simple: `
Stack and Queue are linear data structures used to store data.

Stack follows **LIFO** (Last In, First Out).
Queue follows **FIFO** (First In, First Out).

They are used in different scenarios based on access order.
`,

      analogy: `
Stack is like a stack of plates:
• You remove the top plate first

Queue is like a line at a bus stop:
• The first person in line gets served first

Both manage data but in different orders.
`,

      code: `
# Stack using array
stack = []
stack.append(10)
stack.append(20)
stack.pop()  # removes 20

# Queue using deque
from collections import deque
queue = deque()
queue.append(10)
queue.append(20)
queue.popleft()  # removes 10
`,

      summary: `
• Stack: LIFO, used in undo/redo, recursion
• Queue: FIFO, used in scheduling, buffering
• Both are fundamental data structures
`,
    },
  },

  /* ============================================================
     4️⃣ TIME COMPLEXITY
  ============================================================ */
  {
    _id: "mock-time-complexity",
    question: "What is time complexity?",
    title: "Understanding Time Complexity",
    createdAt: new Date().toISOString(),
    answers: {
      simple: `
Time complexity measures how fast an algorithm runs as input size increases.

It does not measure actual time but how the number of operations grows.

It is commonly expressed using Big-O notation.
`,

      analogy: `
Imagine walking to class:
• Walking alone = linear time
• Asking every student for directions = quadratic time

Time complexity compares efficiency, not speed.
`,

      code: `
# O(n) example
for i in range(n):
  print(i)

# O(n²) example
for i in range(n):
  for j in range(n):
    print(i, j)
`,

      summary: `
• Measures algorithm efficiency
• Expressed using Big-O notation
• Helps compare algorithms
• Common types: O(1), O(n), O(n²)
`,
    },
  },
];
