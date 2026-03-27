#!/usr/bin/env python
"""
CodeBlue AI Hackathon Demo — Unified Dev Runner (Python fallback)

Usage:
    python run_demo.py

Starts both FastAPI backend and React frontend with a single command.
Handles graceful shutdown on Ctrl+C.
"""

import subprocess
import sys
import os
import signal
import time
from pathlib import Path


def print_banner():
    """Print startup banner."""
    print("\n" + "=" * 70)
    print("🚀 CodeBlue AI Hackathon Demo — Starting...")
    print("=" * 70)
    print("\n📍 Backend:  http://localhost:8000 (API & Docs)")
    print("📍 Frontend: http://localhost:3000 (React)")
    print("\n💡 Press Ctrl+C to stop both services\n")
    print("=" * 70 + "\n")


def run_demo():
    """Start backend and frontend processes."""
    processes = []
    root_dir = Path(__file__).parent.absolute()
    
    # Change to root directory
    os.chdir(root_dir)
    
    print_banner()
    
    # Start backend
    print("[BACKEND] Starting FastAPI...")
    backend_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--reload", "--port", "8000"],
        cwd=root_dir / "backend",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
    )
    processes.append(("Backend", backend_process))
    time.sleep(2)  # Give backend time to start
    
    # Start frontend
    print("[FRONTEND] Starting React + Vite...")
    
    # Detect OS to determine npm command
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    
    frontend_process = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=root_dir / "frontend",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
    )
    processes.append(("Frontend", frontend_process))
    
    # Print initial startup messages
    time.sleep(2)
    print("\n✅ Both services started!")
    print("\nOpen your browser to:")
    print("  → Frontend:   http://localhost:3000")
    print("  → Backend:    http://localhost:8000/docs\n")
    
    try:
        # Keep processes running and capture output
        while True:
            for name, process in processes:
                if process.poll() is not None:
                    print(f"\n⚠️  {name} process exited unexpectedly!")
                    cleanup(processes)
                    sys.exit(1)
            time.sleep(1)
    
    except KeyboardInterrupt:
        print("\n\n🛑 Shutting down...")
        cleanup(processes)
        print("✅ All services stopped gracefully.\n")


def cleanup(processes):
    """Gracefully terminate all child processes."""
    for name, process in processes:
        if process.poll() is None:
            print(f"   Stopping {name}...")
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                print(f"   Force killing {name}...")
                process.kill()


if __name__ == "__main__":
    try:
        run_demo()
    except Exception as e:
        print(f"\n❌ Error: {e}", file=sys.stderr)
        sys.exit(1)
