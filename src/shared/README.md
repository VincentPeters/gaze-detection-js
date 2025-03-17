# Shared Code

This directory contains code that is shared between the main and renderer processes.

## Structure

- `constants/`: Shared constant values and enumerations
- `types/`: TypeScript type definitions and interfaces

The shared code ensures consistency between the main and renderer processes by:
- Providing common type definitions
- Defining constants that are used in both processes
- Establishing a contract for IPC communication
