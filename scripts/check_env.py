import os
import sys
import platform
import subprocess
import shutil

# Enable ANSI colors on Windows
if os.name == 'nt':
    os.system('color')

# ANSI Color Codes
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"

def print_success(msg):
    print(f"{GREEN}[SUCCESS] {msg}{RESET}")

def print_warning(msg):
    print(f"{YELLOW}[WARNING] {msg}{RESET}")

def print_error(msg):
    print(f"{RED}[ERROR] {msg}{RESET}")

def print_info(msg):
    print(f"[INFO] {msg}")

def check_python_version():
    print_info("Checking Python version...")
    if sys.version_info >= (3, 10):
        print_success(f"Python version is {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}, which is >= 3.10")
        return True
    else:
        print_error(f"Python version is {sys.version_info.major}.{sys.version_info.minor}, which is < 3.10. Please upgrade Python.")
        return False

def is_tool_installed(name):
    return shutil.which(name) is not None

def check_docker():
    print_info("Checking Docker and Docker Compose...")
    docker_installed = is_tool_installed("docker")
    compose_installed = is_tool_installed("docker-compose") or (is_tool_installed("docker") and subprocess.run(["docker", "compose", "version"], capture_output=True).returncode == 0)

    if not docker_installed:
        print_error("Docker is not installed.")
        return False
    
    if not compose_installed:
        print_error("Docker Compose is not installed.")
        return False

    # Check if daemon is running
    try:
        subprocess.check_output(["docker", "info"], stderr=subprocess.STDOUT)
        print_success("Docker and Docker Compose are installed and the Docker daemon is running.")
        return True
    except subprocess.CalledProcessError:
        print_warning("Docker is installed but the daemon is not running. Please start Docker Desktop or the docker service.")
        return False
    except Exception as e:
        print_warning(f"Error checking docker status: {e}")
        return False

def check_tshark():
    print_info("Checking tshark (Wireshark CLI)...")
    if is_tool_installed("tshark"):
        print_success("tshark is installed.")
        return True
    else:
        print_error("tshark is not installed.")
        return False

def install_dependencies(missing_docker, missing_tshark):
    os_name = platform.system().lower()
    
    if os_name == "linux":
        print_info("Detected Linux. Attempting auto-installation...")
        try:
            packages = []
            if missing_tshark: packages.append("tshark")
            if missing_docker: packages.extend(["docker.io", "docker-compose"])
            
            if packages:
                print_info(f"Running: sudo apt-get update && sudo apt-get install -y {' '.join(packages)}")
                subprocess.run(["sudo", "apt-get", "update"], check=True)
                subprocess.run(["sudo", "apt-get", "install", "-y"] + packages, check=True)
                print_success("Dependencies installed successfully.")
            else:
                print_success("No missing dependencies to install.")
        except subprocess.CalledProcessError as e:
            print_error(f"Auto-installation failed: {e}")
            
    elif os_name == "darwin":
        print_info("Detected macOS. Attempting auto-installation via Homebrew...")
        try:
            if missing_tshark:
                print_info("Running: brew install wireshark-chmodbpf")
                subprocess.run(["brew", "install", "wireshark-chmodbpf"], check=True)
            if missing_docker:
                print_info("Running: brew install --cask docker")
                subprocess.run(["brew", "install", "--cask", "docker"], check=True)
            print_success("Dependencies installed successfully.")
        except subprocess.CalledProcessError as e:
            print_error(f"Auto-installation failed: {e}")
            
    elif os_name == "windows":
        print_warning("Detected Windows. Auto-installation is not fully supported.")
        if missing_docker:
            print_warning("Please download and install Docker Desktop for Windows:")
            print_info("URL: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe")
        if missing_tshark:
            print_warning("Please download and install Wireshark for Windows (includes tshark):")
            print_info("URL: https://2.na.dl.wireshark.org/win64/Wireshark-win64-4.2.0.exe")
    else:
        print_warning(f"Unsupported OS: {os_name}")

def check_python_libraries():
    print_info("Checking for Python dependencies...")
    # Look for requirements.txt in current directory or backend/
    req_file = None
    if os.path.exists("requirements.txt"):
        req_file = "requirements.txt"
    elif os.path.exists(os.path.join("backend", "requirements.txt")):
        req_file = os.path.join("backend", "requirements.txt")
        
    if req_file:
        print_info(f"Found {req_file}. Installing packages...")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "-r", req_file], check=True)
            print_success("Python libraries installed successfully.")
        except subprocess.CalledProcessError as e:
            print_error(f"Failed to install Python libraries: {e}")
    else:
        print_warning("No requirements.txt found. Skipping Python library installation.")

def print_requirements_summary():
    print("\n--- Dependencies Summary ---")
    print(f"{YELLOW}Are all of these required?{RESET}")
    print(f"{GREEN}- Python 3.10+:{RESET} REQUIRED to run the backend and data processing natively.")
    print(f"{GREEN}- Python Packages (requirements.txt):{RESET} REQUIRED to run the backend services natively.")
    print(f"{YELLOW}- Docker & Docker Compose:{RESET} OPTIONAL for local development if you run natively, but REQUIRED if you want to deploy the full stack via containers.")
    print(f"{YELLOW}- tshark (Wireshark):{RESET} REQUIRED ONLY IF your backend relies on network packet capture and analysis workflows within JusticeFlowX.")
    print("----------------------------\n")

def main():
    print("\n========================================")
    print(" JusticeFlowX Environment Verification")
    print("========================================\n")

    check_python_version()
    
    # Check docker and tshark
    check_docker()
    check_tshark()
    
    missing_docker = not is_tool_installed("docker") or not (is_tool_installed("docker-compose") or (is_tool_installed("docker") and subprocess.run(["docker", "compose", "version"], capture_output=True).returncode == 0))
    missing_tshark = not is_tool_installed("tshark")
    
    if missing_docker or missing_tshark:
        install_dependencies(missing_docker, missing_tshark)
    else:
        print_success("System-level dependencies (Docker, tshark) are already installed.")
        
    check_python_libraries()
    print_requirements_summary()

if __name__ == "__main__":
    main()
